const express = require('express');
const { param, body } = require('express-validator');
const flightController = require('../controllers/flightController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get flight status by flight number
router.get('/status/:flightNumber', [
  param('flightNumber').trim().isLength({ min: 1 }).withMessage('Flight number is required')
], flightController.getFlightStatus);

// Get flight status by route
router.get('/route/:departure/:arrival', [
  param('departure').isLength({ min: 3, max: 3 }).withMessage('Valid departure airport code required'),
  param('arrival').isLength({ min: 3, max: 3 }).withMessage('Valid arrival airport code required')
], flightController.getFlightsByRoute);

// Add flight to trip (authenticated)
router.post('/trip/:tripId', authenticateToken, [
  param('tripId').isUUID().withMessage('Valid trip ID is required'),
  body('flightNumber').trim().isLength({ min: 1 }).withMessage('Flight number is required'),
  body('airline').optional().isString(),
  body('departureAirport').isLength({ min: 3, max: 3 }).withMessage('Valid departure airport code required'),
  body('arrivalAirport').isLength({ min: 3, max: 3 }).withMessage('Valid arrival airport code required'),
  body('scheduledDeparture').optional().isISO8601().withMessage('Valid departure time required'),
  body('scheduledArrival').optional().isISO8601().withMessage('Valid arrival time required')
], flightController.addFlightToTrip);

// Get flights for trip
router.get('/trip/:tripId', authenticateToken, [
  param('tripId').isUUID().withMessage('Valid trip ID is required')
], flightController.getTripFlights);

// Update flight status
router.put('/:id', authenticateToken, [
  param('id').isUUID().withMessage('Valid flight ID is required')
], flightController.updateFlightStatus);

// Delete flight from trip
router.delete('/:id', authenticateToken, [
  param('id').isUUID().withMessage('Valid flight ID is required')
], flightController.removeFlightFromTrip);

module.exports = router;