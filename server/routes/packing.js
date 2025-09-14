const express = require('express');
const { body, param } = require('express-validator');
const packingController = require('../controllers/packingController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get packing templates
router.get('/templates', packingController.getPackingTemplates);

// Get template by ID
router.get('/templates/:id', [
  param('id').isUUID().withMessage('Valid template ID is required')
], packingController.getTemplateById);

// Create packing template (authenticated)
router.post('/templates', authenticateToken, [
  body('name').trim().isLength({ min: 1 }).withMessage('Template name is required'),
  body('tripType').optional().isString(),
  body('climate').optional().isString(),
  body('durationDays').optional().isInt({ min: 1 }).withMessage('Duration must be positive'),
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.name').trim().isLength({ min: 1 }).withMessage('Item name is required'),
  body('items.*.category').optional().isString(),
  body('items.*.quantity').optional().isInt({ min: 1 }),
  body('items.*.isEssential').optional().isBoolean()
], packingController.createTemplate);

// Apply template to trip
router.post('/trips/:tripId/apply-template', authenticateToken, [
  param('tripId').isUUID().withMessage('Valid trip ID is required'),
  body('templateId').isUUID().withMessage('Valid template ID is required')
], packingController.applyTemplateToTrip);

// Get packing list for trip
router.get('/trips/:tripId', authenticateToken, [
  param('tripId').isUUID().withMessage('Valid trip ID is required')
], packingController.getTripPackingList);

// Add item to trip packing list
router.post('/trips/:tripId/items', authenticateToken, [
  param('tripId').isUUID().withMessage('Valid trip ID is required'),
  body('name').trim().isLength({ min: 1 }).withMessage('Item name is required'),
  body('category').optional().isString(),
  body('quantity').optional().isInt({ min: 1 }),
  body('isEssential').optional().isBoolean()
], packingController.addPackingItem);

// Update packing item
router.put('/items/:id', authenticateToken, [
  param('id').isUUID().withMessage('Valid item ID is required')
], packingController.updatePackingItem);

// Delete packing item
router.delete('/items/:id', authenticateToken, [
  param('id').isUUID().withMessage('Valid item ID is required')
], packingController.deletePackingItem);

module.exports = router;