const express = require('express');
const { body, param } = require('express-validator');
const stopController = require('../controllers/stopController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all stops for a day
router.get('/day/:dayId', authenticateToken, [
  param('dayId').isUUID().withMessage('Valid day ID is required')
], stopController.getStopsByDay);

// Get single stop
router.get('/:id', authenticateToken, [
  param('id').isUUID().withMessage('Valid stop ID is required')
], stopController.getStopById);

// Create new stop
router.post('/', authenticateToken, [
  body('dayId').isUUID().withMessage('Valid day ID is required'),
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('address').optional().isString(),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('stopType').optional().isIn(['attraction', 'restaurant', 'hotel', 'transport', 'activity', 'shopping', 'other']),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be positive'),
  body('durationMinutes').optional().isInt({ min: 1 }).withMessage('Duration must be positive')
], stopController.createStop);

// Update stop
router.put('/:id', authenticateToken, [
  param('id').isUUID().withMessage('Valid stop ID is required'),
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('stopType').optional().isIn(['attraction', 'restaurant', 'hotel', 'transport', 'activity', 'shopping', 'other']),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be positive'),
  body('durationMinutes').optional().isInt({ min: 1 }).withMessage('Duration must be positive')
], stopController.updateStop);

// Delete stop
router.delete('/:id', authenticateToken, [
  param('id').isUUID().withMessage('Valid stop ID is required')
], stopController.deleteStop);

// Reorder stops within a day
router.put('/day/:dayId/reorder', authenticateToken, [
  param('dayId').isUUID().withMessage('Valid day ID is required'),
  body('stopOrders').isArray().withMessage('Stop orders must be an array'),
  body('stopOrders.*.id').isUUID().withMessage('Stop ID must be valid UUID'),
  body('stopOrders.*.orderIndex').isInt({ min: 0 }).withMessage('Order index must be non-negative integer')
], stopController.reorderStops);

module.exports = router;