const express = require('express');
const { param } = require('express-validator');
const weatherController = require('../controllers/weatherController');

const router = express.Router();

// Get current weather for location
router.get('/current/:location', [
  param('location').trim().isLength({ min: 1 }).withMessage('Location is required')
], weatherController.getCurrentWeather);

// Get weather forecast for location
router.get('/forecast/:location', [
  param('location').trim().isLength({ min: 1 }).withMessage('Location is required')
], weatherController.getWeatherForecast);

// Get weather for specific coordinates
router.get('/coords/:lat/:lon', [
  param('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  param('lon').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required')
], weatherController.getWeatherByCoords);

module.exports = router;