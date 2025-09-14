const express = require('express');
const { body, param } = require('express-validator');
const tripController = require('../controllers/tripController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all trips for authenticated user
router.get('/', authenticateToken, tripController.getUserTrips);

// Get single trip (public or owned)
router.get('/:id', optionalAuth, tripController.getTripById);

// Create new trip
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('destination').trim().isLength({ min: 1 }).withMessage('Destination is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters')
], tripController.createTrip);

// Update trip
router.put('/:id', authenticateToken, [
  param('id').isUUID().withMessage('Valid trip ID is required'),
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('destination').optional().trim().isLength({ min: 1 }).withMessage('Destination cannot be empty'),
  body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number')
], tripController.updateTrip);

// Delete trip
router.delete('/:id', authenticateToken, [
  param('id').isUUID().withMessage('Valid trip ID is required')
], tripController.deleteTrip);

// Share trip (toggle public/generate share token)
router.post('/:id/share', authenticateToken, [
  param('id').isUUID().withMessage('Valid trip ID is required')
], tripController.shareTrip);

// Unshare trip
router.delete('/:id/share', authenticateToken, [
  param('id').isUUID().withMessage('Valid trip ID is required')
], tripController.unshareTrip);

module.exports = router;