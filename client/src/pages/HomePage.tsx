import React from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  AppBar,
  Toolbar,
} from '@mui/material';
import { Flight, TravelExplore, Schedule, Share } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <TravelExplore sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'AI-Powered Planning',
      description: 'Generate detailed itineraries with our AI assistant. Just tell us your destination and preferences.',
    },
    {
      icon: <Schedule sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Interactive Timeline',
      description: 'Visualize your trip with an interactive timeline and map. Drag and drop to reorder activities.',
    },
    {
      icon: <Share sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Share Your Adventures',
      description: 'Share your itineraries with friends and family. Export to calendar or PDF for offline access.',
    },
  ];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Flight sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Travel&Joy
          </Typography>
          {!user ? (
            <Box>
              <Button color="inherit" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button color="inherit" onClick={() => navigate('/register')}>
                Sign Up
              </Button>
            </Box>
          ) : (
            <Button color="inherit" onClick={() => navigate('/trips')}>
              My Trips
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box
          sx={{
            py: 8,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 2,
            color: 'white',
            my: 4,
          }}
        >
          <Typography variant="h2" component="h1" gutterBottom>
            Plan Your Perfect Trip
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 4 }}>
            AI-powered travel planning made simple
          </Typography>
          <Button
            variant="contained"
            size="large"
            color="secondary"
            onClick={() => navigate(user ? '/trips/new' : '/register')}
            sx={{ mr: 2 }}
          >
            {user ? 'Create New Trip' : 'Get Started'}
          </Button>
          {!user && (
            <Button
              variant="outlined"
              size="large"
              sx={{ color: 'white', borderColor: 'white' }}
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          )}
        </Box>

        {/* Features Section */}
        <Box sx={{ py: 8 }}>
          <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
            Everything You Need
          </Typography>
          <Typography variant="h6" textAlign="center" color="textSecondary" sx={{ mb: 6 }}>
            Powerful features to make trip planning effortless
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
            {features.map((feature, index) => (
              <Box key={index} sx={{ flex: 1 }}>
                <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                  <CardContent>
                    <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                    <Typography variant="h5" component="h3" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>

        {/* CTA Section */}
        <Box
          sx={{
            py: 8,
            textAlign: 'center',
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: 2,
            my: 4,
          }}
        >
          <Typography variant="h4" component="h2" gutterBottom>
            Ready to Start Planning?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4 }}>
            Join thousands of travelers who trust Travel&Joy
          </Typography>
          <Button
            variant="contained"
            size="large"
            color="secondary"
            onClick={() => navigate(user ? '/trips/new' : '/register')}
          >
            {user ? 'Create Your First Trip' : 'Sign Up Now'}
          </Button>
        </Box>

        {/* Footer */}
        <Box sx={{ py: 4, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="textSecondary">
            © 2024 Travel&Joy. Built with ❤️ for travelers.
          </Typography>
        </Box>
      </Container>
    </>
  );
};

export default HomePage;