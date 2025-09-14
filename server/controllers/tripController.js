const { validationResult } = require('express-validator');
const { query } = require('../config/database');
const { generateShareToken } = require('../utils/jwt');

const getUserTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT id, title, description, destination, start_date, end_date, 
              budget, currency, is_public, created_at, updated_at
       FROM trips 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM trips WHERE user_id = $1',
      [userId]
    );

    res.json({
      trips: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Get user trips error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    let tripQuery;
    let queryParams;

    if (userId) {
      // User is authenticated - can see their own trips or public trips
      tripQuery = `
        SELECT t.*, u.first_name, u.last_name,
               CASE WHEN t.user_id = $2 THEN true ELSE false END as is_owner
        FROM trips t
        JOIN users u ON t.user_id = u.id
        WHERE t.id = $1 AND (t.user_id = $2 OR t.is_public = true)
      `;
      queryParams = [id, userId];
    } else {
      // User is not authenticated - only public trips
      tripQuery = `
        SELECT t.*, u.first_name, u.last_name, false as is_owner
        FROM trips t
        JOIN users u ON t.user_id = u.id
        WHERE t.id = $1 AND t.is_public = true
      `;
      queryParams = [id];
    }

    const result = await query(tripQuery, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found or not accessible' });
    }

    const trip = result.rows[0];

    // Get days and stops if user has access
    if (trip.is_owner || trip.is_public) {
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
        [id]
      );

      trip.days = daysResult.rows.map(day => ({
        ...day,
        stops: day.stops.filter(stop => stop.id !== null)
      }));
    }

    res.json({ trip });
  } catch (error) {
    console.error('Get trip by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createTrip = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, destination, startDate, endDate, budget, currency } = req.body;
    const userId = req.user.id;

    // Validate date range
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const result = await query(
      `INSERT INTO trips (user_id, title, description, destination, start_date, end_date, budget, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, title, description, destination, startDate, endDate, budget, currency || 'USD']
    );

    // Create days for the trip
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = [];
    let dayNumber = 1;

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayResult = await query(
        `INSERT INTO days (trip_id, date, day_number)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [result.rows[0].id, date.toISOString().split('T')[0], dayNumber]
      );
      days.push(dayResult.rows[0]);
      dayNumber++;
    }

    res.status(201).json({
      message: 'Trip created successfully',
      trip: { ...result.rows[0], days }
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateTrip = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Check if trip exists and user owns it
    const tripResult = await query(
      'SELECT * FROM trips WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Validate date range if dates are being updated
    if (updates.startDate && updates.endDate) {
      if (new Date(updates.startDate) >= new Date(updates.endDate)) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
    }

    // Build dynamic update query
    const allowedFields = ['title', 'description', 'destination', 'start_date', 'end_date', 'budget', 'currency'];
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
    updateValues.push(id, userId);

    const result = await query(
      `UPDATE trips SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1} 
       RETURNING *`,
      updateValues
    );

    res.json({
      message: 'Trip updated successfully',
      trip: result.rows[0]
    });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      'DELETE FROM trips WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const shareTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const shareToken = generateShareToken();

    const result = await query(
      `UPDATE trips 
       SET is_public = true, share_token = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3 
       RETURNING share_token`,
      [shareToken, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json({
      message: 'Trip shared successfully',
      shareToken: result.rows[0].share_token,
      shareUrl: `${req.protocol}://${req.get('host')}/share/${result.rows[0].share_token}`
    });
  } catch (error) {
    console.error('Share trip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const unshareTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      `UPDATE trips 
       SET is_public = false, share_token = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json({ message: 'Trip unshared successfully' });
  } catch (error) {
    console.error('Unshare trip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getUserTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  shareTrip,
  unshareTrip
};