const { validationResult } = require('express-validator');
const axios = require('axios');
const { query } = require('../config/database');

const WEATHER_API_URL = process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

const getCurrentWeather = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { location } = req.params;

    if (!WEATHER_API_KEY) {
      return res.status(503).json({ 
        message: 'Weather service not configured',
        fallback: createFallbackWeather(location)
      });
    }

    try {
      const response = await axios.get(`${WEATHER_API_URL}/weather`, {
        params: {
          q: location,
          appid: WEATHER_API_KEY,
          units: 'metric'
        },
        timeout: 5000
      });

      const weatherData = {
        location: response.data.name,
        country: response.data.sys.country,
        temperature: Math.round(response.data.main.temp),
        feelsLike: Math.round(response.data.main.feels_like),
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        windSpeed: response.data.wind.speed,
        windDirection: response.data.wind.deg,
        visibility: response.data.visibility,
        cloudiness: response.data.clouds.all,
        coordinates: {
          lat: response.data.coord.lat,
          lon: response.data.coord.lon
        },
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        weather: weatherData
      });
    } catch (apiError) {
      console.error('Weather API error:', apiError.message);
      res.status(503).json({
        message: 'Weather service temporarily unavailable',
        fallback: createFallbackWeather(location)
      });
    }
  } catch (error) {
    console.error('Get current weather error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getWeatherForecast = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { location } = req.params;
    const { days = 5 } = req.query;

    if (!WEATHER_API_KEY) {
      return res.status(503).json({ 
        message: 'Weather service not configured',
        fallback: createFallbackForecast(location, parseInt(days))
      });
    }

    try {
      const response = await axios.get(`${WEATHER_API_URL}/forecast`, {
        params: {
          q: location,
          appid: WEATHER_API_KEY,
          units: 'metric',
          cnt: Math.min(parseInt(days) * 8, 40) // 8 forecasts per day (3-hour intervals)
        },
        timeout: 5000
      });

      const forecast = response.data.list.map(item => ({
        date: new Date(item.dt * 1000).toISOString(),
        temperature: Math.round(item.main.temp),
        minTemp: Math.round(item.main.temp_min),
        maxTemp: Math.round(item.main.temp_max),
        humidity: item.main.humidity,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        windSpeed: item.wind.speed,
        precipitation: item.rain ? (item.rain['3h'] || 0) : 0
      }));

      res.json({
        success: true,
        location: response.data.city.name,
        country: response.data.city.country,
        forecast
      });
    } catch (apiError) {
      console.error('Weather forecast API error:', apiError.message);
      res.status(503).json({
        message: 'Weather forecast service temporarily unavailable',
        fallback: createFallbackForecast(location, parseInt(days))
      });
    }
  } catch (error) {
    console.error('Get weather forecast error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getWeatherByCoords = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lat, lon } = req.params;

    // Check cache first
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `${lat},${lon}`;
    
    try {
      const cachedResult = await query(
        'SELECT weather_data FROM weather_cache WHERE location = $1 AND date = $2',
        [cacheKey, today]
      );

      if (cachedResult.rows.length > 0) {
        return res.json({
          success: true,
          weather: cachedResult.rows[0].weather_data,
          cached: true
        });
      }
    } catch (cacheError) {
      console.error('Weather cache error:', cacheError);
    }

    if (!WEATHER_API_KEY) {
      return res.status(503).json({ 
        message: 'Weather service not configured',
        fallback: createFallbackWeatherByCoords(lat, lon)
      });
    }

    try {
      const response = await axios.get(`${WEATHER_API_URL}/weather`, {
        params: {
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          appid: WEATHER_API_KEY,
          units: 'metric'
        },
        timeout: 5000
      });

      const weatherData = {
        location: response.data.name,
        country: response.data.sys.country,
        temperature: Math.round(response.data.main.temp),
        feelsLike: Math.round(response.data.main.feels_like),
        humidity: response.data.main.humidity,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        windSpeed: response.data.wind.speed,
        coordinates: {
          lat: parseFloat(lat),
          lon: parseFloat(lon)
        },
        timestamp: new Date().toISOString()
      };

      // Cache the result
      try {
        await query(
          `INSERT INTO weather_cache (location, date, weather_data) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (location, date) 
           DO UPDATE SET weather_data = $3`,
          [cacheKey, today, JSON.stringify(weatherData)]
        );
      } catch (cacheError) {
        console.error('Weather cache save error:', cacheError);
      }

      res.json({
        success: true,
        weather: weatherData
      });
    } catch (apiError) {
      console.error('Weather API error:', apiError.message);
      res.status(503).json({
        message: 'Weather service temporarily unavailable',
        fallback: createFallbackWeatherByCoords(lat, lon)
      });
    }
  } catch (error) {
    console.error('Get weather by coords error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Fallback functions for when weather API is unavailable
const createFallbackWeather = (location) => ({
  location,
  country: 'Unknown',
  temperature: 20,
  feelsLike: 22,
  humidity: 60,
  description: 'Weather data unavailable',
  icon: '01d',
  windSpeed: 5,
  coordinates: { lat: 0, lon: 0 },
  timestamp: new Date().toISOString(),
  fallback: true
});

const createFallbackForecast = (location, days) => {
  const forecast = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    forecast.push({
      date: date.toISOString(),
      temperature: 20 + Math.random() * 10,
      minTemp: 15 + Math.random() * 5,
      maxTemp: 25 + Math.random() * 10,
      humidity: 50 + Math.random() * 30,
      description: 'Weather data unavailable',
      icon: '01d',
      windSpeed: 5 + Math.random() * 10,
      precipitation: 0
    });
  }
  return { location, forecast, fallback: true };
};

const createFallbackWeatherByCoords = (lat, lon) => ({
  location: `Location ${lat}, ${lon}`,
  country: 'Unknown',
  temperature: 20,
  feelsLike: 22,
  humidity: 60,
  description: 'Weather data unavailable',
  icon: '01d',
  windSpeed: 5,
  coordinates: { lat: parseFloat(lat), lon: parseFloat(lon) },
  timestamp: new Date().toISOString(),
  fallback: true
});

module.exports = {
  getCurrentWeather,
  getWeatherForecast,
  getWeatherByCoords
};