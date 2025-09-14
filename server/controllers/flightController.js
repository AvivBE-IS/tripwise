const { validationResult } = require('express-validator');
const axios = require('axios');
const { query } = require('../config/database');

const AVIATIONSTACK_API_URL = process.env.AVIATIONSTACK_API_URL || 'http://api.aviationstack.com/v1';
const AVIATIONSTACK_API_KEY = process.env.AVIATIONSTACK_API_KEY;

const getFlightStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { flightNumber } = req.params;

    if (!AVIATIONSTACK_API_KEY) {
      return res.status(503).json({ 
        message: 'Flight tracking service not configured',
        fallback: createFallbackFlightStatus(flightNumber)
      });
    }

    try {
      const response = await axios.get(`${AVIATIONSTACK_API_URL}/flights`, {
        params: {
          access_key: AVIATIONSTACK_API_KEY,
          flight_iata: flightNumber.toUpperCase(),
          limit: 1
        },
        timeout: 5000
      });

      if (response.data.data && response.data.data.length > 0) {
        const flight = response.data.data[0];
        const flightData = {
          flightNumber: flight.flight.iata,
          airline: flight.airline.name,
          aircraft: flight.aircraft?.iata || 'Unknown',
          status: flight.flight_status,
          departure: {
            airport: flight.departure.airport,
            iata: flight.departure.iata,
            gate: flight.departure.gate,
            terminal: flight.departure.terminal,
            scheduled: flight.departure.scheduled,
            estimated: flight.departure.estimated,
            actual: flight.departure.actual,
            delay: flight.departure.delay
          },
          arrival: {
            airport: flight.arrival.airport,
            iata: flight.arrival.iata,
            gate: flight.arrival.gate,
            terminal: flight.arrival.terminal,
            scheduled: flight.arrival.scheduled,
            estimated: flight.arrival.estimated,
            actual: flight.arrival.actual,
            delay: flight.arrival.delay
          },
          timestamp: new Date().toISOString()
        };

        res.json({
          success: true,
          flight: flightData
        });
      } else {
        res.status(404).json({
          message: 'Flight not found',
          fallback: createFallbackFlightStatus(flightNumber)
        });
      }
    } catch (apiError) {
      console.error('Aviationstack API error:', apiError.message);
      res.status(503).json({
        message: 'Flight tracking service temporarily unavailable',
        fallback: createFallbackFlightStatus(flightNumber)
      });
    }
  } catch (error) {
    console.error('Get flight status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getFlightsByRoute = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { departure, arrival } = req.params;

    if (!AVIATIONSTACK_API_KEY) {
      return res.status(503).json({ 
        message: 'Flight tracking service not configured',
        fallback: createFallbackRouteFlights(departure, arrival)
      });
    }

    try {
      const response = await axios.get(`${AVIATIONSTACK_API_URL}/flights`, {
        params: {
          access_key: AVIATIONSTACK_API_KEY,
          dep_iata: departure.toUpperCase(),
          arr_iata: arrival.toUpperCase(),
          limit: 10
        },
        timeout: 5000
      });

      const flights = response.data.data.map(flight => ({
        flightNumber: flight.flight.iata,
        airline: flight.airline.name,
        aircraft: flight.aircraft?.iata || 'Unknown',
        status: flight.flight_status,
        departure: {
          airport: flight.departure.airport,
          iata: flight.departure.iata,
          scheduled: flight.departure.scheduled,
          estimated: flight.departure.estimated
        },
        arrival: {
          airport: flight.arrival.airport,
          iata: flight.arrival.iata,
          scheduled: flight.arrival.scheduled,
          estimated: flight.arrival.estimated
        }
      }));

      res.json({
        success: true,
        route: `${departure.toUpperCase()} → ${arrival.toUpperCase()}`,
        flights
      });
    } catch (apiError) {
      console.error('Aviationstack API error:', apiError.message);
      res.status(503).json({
        message: 'Flight tracking service temporarily unavailable',
        fallback: createFallbackRouteFlights(departure, arrival)
      });
    }
  } catch (error) {
    console.error('Get flights by route error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const addFlightToTrip = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tripId } = req.params;
    const {
      flightNumber,
      airline,
      departureAirport,
      arrivalAirport,
      scheduledDeparture,
      scheduledArrival
    } = req.body;
    const userId = req.user.id;

    // Verify user owns the trip
    const tripResult = await query(
      'SELECT id FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, userId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const result = await query(
      `INSERT INTO flight_status (
        trip_id, flight_number, airline, departure_airport, arrival_airport,
        scheduled_departure, scheduled_arrival, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        tripId, flightNumber.toUpperCase(), airline,
        departureAirport.toUpperCase(), arrivalAirport.toUpperCase(),
        scheduledDeparture, scheduledArrival, 'scheduled'
      ]
    );

    res.status(201).json({
      message: 'Flight added to trip successfully',
      flight: result.rows[0]
    });
  } catch (error) {
    console.error('Add flight to trip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTripFlights = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tripId } = req.params;
    const userId = req.user.id;

    // Verify user owns the trip
    const tripResult = await query(
      'SELECT id FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, userId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const result = await query(
      'SELECT * FROM flight_status WHERE trip_id = $1 ORDER BY scheduled_departure',
      [tripId]
    );

    res.json({ flights: result.rows });
  } catch (error) {
    console.error('Get trip flights error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateFlightStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;

    // Verify user owns the trip
    const flightResult = await query(
      `SELECT fs.id 
       FROM flight_status fs
       JOIN trips t ON fs.trip_id = t.id
       WHERE fs.id = $1 AND t.user_id = $2`,
      [id, userId]
    );

    if (flightResult.rows.length === 0) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    // Build dynamic update query
    const allowedFields = [
      'actual_departure', 'actual_arrival', 'status', 'gate', 'terminal'
    ];
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(updates[key]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const result = await query(
      `UPDATE flight_status SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      updateValues
    );

    res.json({
      message: 'Flight status updated successfully',
      flight: result.rows[0]
    });
  } catch (error) {
    console.error('Update flight status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const removeFlightFromTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      `DELETE FROM flight_status 
       WHERE id = $1 AND EXISTS (
         SELECT 1 FROM trips t 
         WHERE t.id = flight_status.trip_id AND t.user_id = $2
       )
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    res.json({ message: 'Flight removed from trip successfully' });
  } catch (error) {
    console.error('Remove flight from trip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Fallback functions for when flight API is unavailable
const createFallbackFlightStatus = (flightNumber) => ({
  flightNumber: flightNumber.toUpperCase(),
  airline: 'Unknown Airline',
  aircraft: 'Unknown',
  status: 'unknown',
  departure: {
    airport: 'Unknown Airport',
    iata: 'UNK',
    gate: null,
    terminal: null,
    scheduled: null,
    estimated: null,
    actual: null,
    delay: null
  },
  arrival: {
    airport: 'Unknown Airport',
    iata: 'UNK',
    gate: null,
    terminal: null,
    scheduled: null,
    estimated: null,
    actual: null,
    delay: null
  },
  timestamp: new Date().toISOString(),
  fallback: true
});

const createFallbackRouteFlights = (departure, arrival) => ({
  route: `${departure.toUpperCase()} → ${arrival.toUpperCase()}`,
  flights: [{
    flightNumber: 'XX1234',
    airline: 'Example Airlines',
    aircraft: 'B737',
    status: 'unknown',
    departure: {
      airport: 'Unknown Airport',
      iata: departure.toUpperCase(),
      scheduled: new Date().toISOString()
    },
    arrival: {
      airport: 'Unknown Airport',
      iata: arrival.toUpperCase(),
      scheduled: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    }
  }],
  fallback: true
});

module.exports = {
  getFlightStatus,
  getFlightsByRoute,
  addFlightToTrip,
  getTripFlights,
  updateFlightStatus,
  removeFlightFromTrip
};