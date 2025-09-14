const express = require('express');
const { param } = require('express-validator');
const shareController = require('../controllers/shareController');

const router = express.Router();

// Get shared trip by token
router.get('/:token', [
  param('token').trim().isLength({ min: 1 }).withMessage('Share token is required')
], shareController.getSharedTrip);

// Export shared trip as JSON
router.get('/:token/export/json', [
  param('token').trim().isLength({ min: 1 }).withMessage('Share token is required')
], shareController.exportTripAsJSON);

// Export shared trip as ICS (calendar)
router.get('/:token/export/ics', [
  param('token').trim().isLength({ min: 1 }).withMessage('Share token is required')
], shareController.exportTripAsICS);

module.exports = router;