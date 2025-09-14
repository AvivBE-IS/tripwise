import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  AppBar,
  Toolbar,
  Button,
} from '@mui/material';
import {
  LocationOn,
  CalendarToday,
  AttachMoney,
  Schedule,
  Flight,
  GetApp,
  Home,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

import { apiClient } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const SharedTripPage: React.FC = () => {
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const loadSharedTrip = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await apiClient.getSharedTrip(token);
      setTrip(response.trip);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Trip not found or no longer shared');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSharedTrip();
  }, [loadSharedTrip]);

  const getTripDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleExport = (format: 'json' | 'ics') => {
    if (!token) return;
    
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const exportUrl = `${baseUrl}/share/${token}/export/${format}`;
    
    // Open in new tab to trigger download
    window.open(exportUrl, '_blank');
  };

  if (loading) {
    return <LoadingSpinner message="Loading shared trip..." />;
  }

  if (error) {
    return (
      <>
        <AppBar position="static">
          <Toolbar>
            <Flight sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Travel&Joy
            </Typography>
            <Button color="inherit" onClick={() => navigate('/')}>
              <Home sx={{ mr: 1 }} />
              Home
            </Button>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </>
    );
  }

  if (!trip) {
    return (
      <>
        <AppBar position="static">
          <Toolbar>
            <Flight sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Travel&Joy
            </Typography>
            <Button color="inherit" onClick={() => navigate('/')}>
              <Home sx={{ mr: 1 }} />
              Home
            </Button>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="info">Trip not found</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Flight sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Travel&Joy - Shared Trip
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>
            <Home sx={{ mr: 1 }} />
            Home
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Trip Header */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {trip.title}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip
                  icon={<LocationOn />}
                  label={trip.destination}
                  color="primary"
                />
                <Chip
                  icon={<CalendarToday />}
                  label={`${format(new Date(trip.startDate), 'MMM d')} - ${format(new Date(trip.endDate), 'MMM d, yyyy')}`}
                />
                <Chip
                  label={`${getTripDuration(trip.startDate, trip.endDate)} days`}
                  variant="outlined"
                />
                {trip.budget && (
                  <Chip
                    icon={<AttachMoney />}
                    label={`${trip.budget} ${trip.currency}`}
                    color="secondary"
                    variant="outlined"
                  />
                )}
                <Chip
                  label="Shared Trip"
                  color="success"
                  variant="outlined"
                />
              </Box>

              {trip.description && (
                <Typography variant="body1" color="textSecondary">
                  {trip.description}
                </Typography>
              )}
            </Box>

            <Box sx={{ minWidth: { xs: '100%', md: '200px' } }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<GetApp />}
                  fullWidth
                  onClick={() => handleExport('json')}
                >
                  Export JSON
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Schedule />}
                  fullWidth
                  onClick={() => handleExport('ics')}
                >
                  Export Calendar
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Itinerary */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Itinerary
          </Typography>
          
          {trip.days && trip.days.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {trip.days.map((day: any) => (
                <Box key={day.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Day {day.dayNumber} - {format(new Date(day.date), 'EEEE, MMM d')}
                      </Typography>
                      {day.title && (
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          {day.title}
                        </Typography>
                      )}
                      {day.stops && day.stops.length > 0 ? (
                        <List dense>
                          {day.stops.map((stop: any) => (
                            <ListItem key={stop.id}>
                              <ListItemIcon>
                                <LocationOn />
                              </ListItemIcon>
                              <ListItemText
                                primary={stop.title}
                                secondary={
                                  <Box>
                                    {stop.address && <div>{stop.address}</div>}
                                    {stop.startTime && (
                                      <div>
                                        Time: {stop.startTime}
                                        {stop.endTime && ` - ${stop.endTime}`}
                                      </div>
                                    )}
                                    {stop.description && <div>{stop.description}</div>}
                                    {stop.cost && (
                                      <div>Cost: {stop.cost} {trip.currency}</div>
                                    )}
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No stops planned for this day
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No itinerary available
              </Typography>
              <Typography variant="body2" color="textSecondary">
                This trip doesn't have a detailed itinerary yet
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Footer */}
        <Box sx={{ py: 4, textAlign: 'center', borderTop: 1, borderColor: 'divider', mt: 4 }}>
          <Typography variant="body2" color="textSecondary">
            Shared from Travel&Joy - Create your own trips at{' '}
            <Button
              variant="text"
              size="small"
              onClick={() => navigate('/')}
            >
              traveljoy.com
            </Button>
          </Typography>
        </Box>
      </Container>
    </>
  );
};

export default SharedTripPage;