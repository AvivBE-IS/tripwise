import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Button,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
} from '@mui/material';
import {
  LocationOn,
  CalendarToday,
  AttachMoney,
  Share,
  Edit,
  Add,
  Schedule,
  CheckBox,
  Flight,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

import { Trip } from '../types';
import { apiClient } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`trip-tabpanel-${index}`}
      aria-labelledby={`trip-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const TripDetailPage: React.FC = () => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const loadTrip = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await apiClient.getTrip(id);
      setTrip(response.trip);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load trip');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  const handleShare = async () => {
    if (!trip) return;

    try {
      const response = await apiClient.shareTrip(trip.id);
      navigator.clipboard.writeText(response.shareUrl);
      alert('Share link copied to clipboard!');
    } catch (err) {
      alert('Failed to share trip');
    }
  };

  const getTripDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return <LoadingSpinner message="Loading trip details..." />;
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!trip) {
    return (
      <Container maxWidth="lg">
        <Alert severity="info">Trip not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
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
              {trip.isPublic && (
                <Chip
                  label="Shared"
                  color="success"
                  variant="outlined"
                />
              )}
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
                variant="contained"
                startIcon={<Edit />}
                fullWidth
                onClick={() => navigate(`/trips/${trip.id}/edit`)}
              >
                Edit Trip
              </Button>
              <Button
                variant="outlined"
                startIcon={<Share />}
                fullWidth
                onClick={handleShare}
              >
                Share Trip
              </Button>
              <Button
                variant="outlined"
                startIcon={<Add />}
                fullWidth
                onClick={() => navigate(`/trips/${trip.id}/stops/new`)}
              >
                Add Stop
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper elevation={3}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          aria-label="trip tabs"
        >
          <Tab icon={<Schedule />} label="Itinerary" />
          <Tab icon={<CheckBox />} label="Packing List" />
          <Tab icon={<Flight />} label="Flights" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* Itinerary Tab */}
          <Typography variant="h6" gutterBottom>
            Daily Itinerary
          </Typography>
          {trip.days && trip.days.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {trip.days.map((day) => (
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
                          {day.stops.map((stop) => (
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
                No itinerary yet
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Start planning your trip by adding stops and activities
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate(`/trips/${trip.id}/stops/new`)}
              >
                Add Your First Stop
              </Button>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Packing List Tab */}
          <Typography variant="h6" gutterBottom>
            Packing List
          </Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="textSecondary">
              Packing list feature coming soon!
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Flights Tab */}
          <Typography variant="h6" gutterBottom>
            Flight Information
          </Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="textSecondary">
              Flight tracking feature coming soon!
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default TripDetailPage;