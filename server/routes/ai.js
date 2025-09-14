const express = require('express');
const { body } = require('express-validator');
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate itinerary using AI
router.post('/generate-itinerary', authenticateToken, [
  body('destination').trim().isLength({ min: 1 }).withMessage('Destination is required'),
  body('duration').isInt({ min: 1, max: 30 }).withMessage('Duration must be between 1 and 30 days'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be positive'),
  body('interests').optional().isArray().withMessage('Interests must be an array'),
  body('travelStyle').optional().isIn(['budget', 'mid-range', 'luxury', 'backpacker', 'family', 'business', 'adventure', 'cultural', 'relaxation']),
  body('groupSize').optional().isInt({ min: 1, max: 50 }).withMessage('Group size must be between 1 and 50')
], aiController.generateItinerary);

// Get AI suggestions for a specific location
router.post('/suggest-activities', authenticateToken, [
  body('location').trim().isLength({ min: 1 }).withMessage('Location is required'),
  body('activityType').optional().isIn(['attraction', 'restaurant', 'activity', 'shopping']),
  body('budget').optional().isIn(['low', 'medium', 'high'])
], aiController.suggestActivities);

module.exports = router;