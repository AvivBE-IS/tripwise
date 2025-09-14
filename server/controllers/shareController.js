const { validationResult } = require('express-validator');
const { query } = require('../config/database');

const getSharedTrip = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;

    const tripResult = await query(
      `SELECT t.*, u.first_name, u.last_name
       FROM trips t
       JOIN users u ON t.user_id = u.id
       WHERE t.share_token = $1 AND t.is_public = true`,
      [token]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: 'Shared trip not found or not available' });
    }

    const trip = tripResult.rows[0];

    // Get days and stops for the shared trip
    const daysResult = await query(
      `SELECT d.*, 
              json_agg(
                json_build_object(
                  'id', s.id,
                  'title', s.title,
                  'description', s.description,
                  'address', s.address,
                  'latitude', s.latitude,
                  'longitude', s.longitude,
                  'stop_type', s.stop_type,
                  'start_time', s.start_time,
                  'end_time', s.end_time,
                  'duration_minutes', s.duration_minutes,
                  'cost', s.cost,
                  'notes', s.notes,
                  'order_index', s.order_index
                ) ORDER BY s.order_index
              ) as stops
       FROM days d
       LEFT JOIN stops s ON d.id = s.day_id
       WHERE d.trip_id = $1
       GROUP BY d.id, d.trip_id, d.date, d.title, d.notes, d.day_number
       ORDER BY d.day_number`,
      [trip.id]
    );

    trip.days = daysResult.rows.map(day => ({
      ...day,
      stops: day.stops.filter(stop => stop.id !== null)
    }));

    // Get packing list for the shared trip
    const packingResult = await query(
      'SELECT * FROM packing_items WHERE trip_id = $1 ORDER BY category, name',
      [trip.id]
    );

    trip.packingList = packingResult.rows;

    // Get flights for the shared trip
    const flightsResult = await query(
      'SELECT * FROM flight_status WHERE trip_id = $1 ORDER BY scheduled_departure',
      [trip.id]
    );

    trip.flights = flightsResult.rows;

    // Remove sensitive information
    delete trip.user_id;
    delete trip.share_token;

    res.json({
      trip,
      shareInfo: {
        isShared: true,
        readOnly: true,
        sharedBy: `${trip.first_name} ${trip.last_name}`,
        sharedAt: trip.updated_at
      }
    });
  } catch (error) {
    console.error('Get shared trip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const exportTripAsJSON = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;

    const tripResult = await query(
      `SELECT t.*, u.first_name, u.last_name
       FROM trips t
       JOIN users u ON t.user_id = u.id
       WHERE t.share_token = $1 AND t.is_public = true`,
      [token]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: 'Shared trip not found or not available' });
    }

    const trip = tripResult.rows[0];

    // Get complete trip data
    const daysResult = await query(
      `SELECT d.*, 
              json_agg(
                json_build_object(
                  'id', s.id,
                  'title', s.title,
                  'description', s.description,
                  'address', s.address,
                  'latitude', s.latitude,
                  'longitude', s.longitude,
                  'stop_type', s.stop_type,
                  'start_time', s.start_time,
                  'end_time', s.end_time,
                  'duration_minutes', s.duration_minutes,
                  'cost', s.cost,
                  'notes', s.notes,
                  'order_index', s.order_index
                ) ORDER BY s.order_index
              ) as stops
       FROM days d
       LEFT JOIN stops s ON d.id = s.day_id
       WHERE d.trip_id = $1
       GROUP BY d.id
       ORDER BY d.day_number`,
      [trip.id]
    );

    const packingResult = await query(
      'SELECT * FROM packing_items WHERE trip_id = $1 ORDER BY category, name',
      [trip.id]
    );

    const flightsResult = await query(
      'SELECT * FROM flight_status WHERE trip_id = $1 ORDER BY scheduled_departure',
      [trip.id]
    );

    const exportData = {
      trip: {
        title: trip.title,
        description: trip.description,
        destination: trip.destination,
        startDate: trip.start_date,
        endDate: trip.end_date,
        budget: trip.budget,
        currency: trip.currency,
        createdBy: `${trip.first_name} ${trip.last_name}`
      },
      days: daysResult.rows.map(day => ({
        ...day,
        stops: day.stops.filter(stop => stop.id !== null)
      })),
      packingList: packingResult.rows,
      flights: flightsResult.rows,
      exportedAt: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${trip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_itinerary.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Export trip as JSON error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const exportTripAsICS = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;

    const tripResult = await query(
      `SELECT t.*, u.first_name, u.last_name
       FROM trips t
       JOIN users u ON t.user_id = u.id
       WHERE t.share_token = $1 AND t.is_public = true`,
      [token]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: 'Shared trip not found or not available' });
    }

    const trip = tripResult.rows[0];

    // Get stops with time information
    const stopsResult = await query(
      `SELECT s.*, d.date, d.day_number
       FROM stops s
       JOIN days d ON s.day_id = d.id
       WHERE d.trip_id = $1 AND s.start_time IS NOT NULL
       ORDER BY d.day_number, s.order_index`,
      [trip.id]
    );

    // Generate ICS content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Travel&Joy//Travel Itinerary//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${trip.title}`,
      `X-WR-CALDESC:${trip.description || 'Travel itinerary'}`
    ];

    // Add main trip event
    const tripStart = new Date(trip.start_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const tripEnd = new Date(trip.end_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    icsContent.push(
      'BEGIN:VEVENT',
      `UID:trip-${trip.id}@traveljoy.com`,
      `DTSTART:${tripStart}`,
      `DTEND:${tripEnd}`,
      `SUMMARY:${trip.title}`,
      `DESCRIPTION:Trip to ${trip.destination}`,
      `LOCATION:${trip.destination}`,
      'END:VEVENT'
    );

    // Add stop events
    stopsResult.rows.forEach(stop => {
      if (stop.start_time) {
        const startDateTime = new Date(`${stop.date}T${stop.start_time}`);
        const endDateTime = stop.end_time 
          ? new Date(`${stop.date}T${stop.end_time}`)
          : new Date(startDateTime.getTime() + (stop.duration_minutes || 60) * 60000);

        const startICS = startDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endICS = endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        icsContent.push(
          'BEGIN:VEVENT',
          `UID:stop-${stop.id}@traveljoy.com`,
          `DTSTART:${startICS}`,
          `DTEND:${endICS}`,
          `SUMMARY:${stop.title}`,
          `DESCRIPTION:${stop.description || ''}`,
          `LOCATION:${stop.address || ''}`,
          'END:VEVENT'
        );
      }
    });

    icsContent.push('END:VCALENDAR');

    const icsString = icsContent.join('\r\n');

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="${trip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_itinerary.ics"`);
    res.send(icsString);
  } catch (error) {
    console.error('Export trip as ICS error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getSharedTrip,
  exportTripAsJSON,
  exportTripAsICS
};