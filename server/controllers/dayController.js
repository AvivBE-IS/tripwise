const { validationResult } = require('express-validator');
const { query } = require('../config/database');

const getDaysByTrip = async (req, res) => {
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

    // Get days with their stops
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
      [tripId]
    );

    const days = daysResult.rows.map(day => ({
      ...day,
      stops: day.stops.filter(stop => stop.id !== null)
    }));

    res.json({ days });
  } catch (error) {
    console.error('Get days by trip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getDayById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user.id;

    // Get day with trip ownership verification
    const dayResult = await query(
      `SELECT d.*, t.user_id as trip_user_id
       FROM days d
       JOIN trips t ON d.trip_id = t.id
       WHERE d.id = $1 AND t.user_id = $2`,
      [id, userId]
    );

    if (dayResult.rows.length === 0) {
      return res.status(404).json({ message: 'Day not found' });
    }

    const day = dayResult.rows[0];

    // Get stops for this day
    const stopsResult = await query(
      'SELECT * FROM stops WHERE day_id = $1 ORDER BY order_index',
      [id]
    );

    day.stops = stopsResult.rows;

    res.json({ day });
  } catch (error) {
    console.error('Get day by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateDay = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Verify user owns the trip
    const dayResult = await query(
      `SELECT d.id 
       FROM days d
       JOIN trips t ON d.trip_id = t.id
       WHERE d.id = $1 AND t.user_id = $2`,
      [id, userId]
    );

    if (dayResult.rows.length === 0) {
      return res.status(404).json({ message: 'Day not found' });
    }

    // Build dynamic update query
    const allowedFields = ['title', 'notes'];
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
      `UPDATE days SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      updateValues
    );

    res.json({
      message: 'Day updated successfully',
      day: result.rows[0]
    });
  } catch (error) {
    console.error('Update day error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getDaysByTrip,
  getDayById,
  updateDay
};