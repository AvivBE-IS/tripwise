const express = require('express');
const { body, param } = require('express-validator');
const dayController = require('../controllers/dayController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all days for a trip
router.get('/trip/:tripId', authenticateToken, [
  param('tripId').isUUID().withMessage('Valid trip ID is required')
], dayController.getDaysByTrip);

// Get single day
router.get('/:id', authenticateToken, [
  param('id').isUUID().withMessage('Valid day ID is required')
], dayController.getDayById);

// Update day
router.put('/:id', authenticateToken, [
  param('id').isUUID().withMessage('Valid day ID is required'),
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('notes').optional().isString()
], dayController.updateDay);

module.exports = router;