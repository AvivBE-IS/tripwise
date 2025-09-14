const { validationResult } = require('express-validator');
const { query } = require('../config/database');

const getStopsByDay = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dayId } = req.params;
    const userId = req.user.id;

    // Verify user owns the trip
    const dayResult = await query(
      `SELECT d.id 
       FROM days d
       JOIN trips t ON d.trip_id = t.id
       WHERE d.id = $1 AND t.user_id = $2`,
      [dayId, userId]
    );

    if (dayResult.rows.length === 0) {
      return res.status(404).json({ message: 'Day not found' });
    }

    const result = await query(
      'SELECT * FROM stops WHERE day_id = $1 ORDER BY order_index',
      [dayId]
    );

    res.json({ stops: result.rows });
  } catch (error) {
    console.error('Get stops by day error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getStopById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      `SELECT s.* 
       FROM stops s
       JOIN days d ON s.day_id = d.id
       JOIN trips t ON d.trip_id = t.id
       WHERE s.id = $1 AND t.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stop not found' });
    }

    res.json({ stop: result.rows[0] });
  } catch (error) {
    console.error('Get stop by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createStop = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      dayId,
      title,
      description,
      address,
      latitude,
      longitude,
      stopType,
      startTime,
      endTime,
      durationMinutes,
      cost,
      notes
    } = req.body;
    const userId = req.user.id;

    // Verify user owns the trip
    const dayResult = await query(
      `SELECT d.id 
       FROM days d
       JOIN trips t ON d.trip_id = t.id
       WHERE d.id = $1 AND t.user_id = $2`,
      [dayId, userId]
    );

    if (dayResult.rows.length === 0) {
      return res.status(404).json({ message: 'Day not found' });
    }

    // Get next order index
    const orderResult = await query(
      'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM stops WHERE day_id = $1',
      [dayId]
    );
    const orderIndex = orderResult.rows[0].next_order;

    const result = await query(
      `INSERT INTO stops (
        day_id, title, description, address, latitude, longitude, 
        stop_type, start_time, end_time, duration_minutes, cost, notes, order_index
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        dayId, title, description, address, latitude, longitude,
        stopType || 'attraction', startTime, endTime, durationMinutes, cost, notes, orderIndex
      ]
    );

    res.status(201).json({
      message: 'Stop created successfully',
      stop: result.rows[0]
    });
  } catch (error) {
    console.error('Create stop error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateStop = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Verify user owns the stop
    const stopResult = await query(
      `SELECT s.id 
       FROM stops s
       JOIN days d ON s.day_id = d.id
       JOIN trips t ON d.trip_id = t.id
       WHERE s.id = $1 AND t.user_id = $2`,
      [id, userId]
    );

    if (stopResult.rows.length === 0) {
      return res.status(404).json({ message: 'Stop not found' });
    }

    // Build dynamic update query
    const allowedFields = [
      'title', 'description', 'address', 'latitude', 'longitude',
      'stop_type', 'start_time', 'end_time', 'duration_minutes', 'cost', 'notes'
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
      `UPDATE stops SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      updateValues
    );

    res.json({
      message: 'Stop updated successfully',
      stop: result.rows[0]
    });
  } catch (error) {
    console.error('Update stop error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteStop = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      `DELETE FROM stops 
       WHERE id = $1 AND EXISTS (
         SELECT 1 FROM days d 
         JOIN trips t ON d.trip_id = t.id 
         WHERE d.id = stops.day_id AND t.user_id = $2
       )
       RETURNING day_id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stop not found' });
    }

    // Reorder remaining stops
    const dayId = result.rows[0].day_id;
    await query(
      `UPDATE stops 
       SET order_index = new_order.row_num - 1
       FROM (
         SELECT id, ROW_NUMBER() OVER (ORDER BY order_index) as row_num
         FROM stops 
         WHERE day_id = $1
       ) as new_order
       WHERE stops.id = new_order.id`,
      [dayId]
    );

    res.json({ message: 'Stop deleted successfully' });
  } catch (error) {
    console.error('Delete stop error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const reorderStops = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dayId } = req.params;
    const { stopOrders } = req.body;
    const userId = req.user.id;

    // Verify user owns the day
    const dayResult = await query(
      `SELECT d.id 
       FROM days d
       JOIN trips t ON d.trip_id = t.id
       WHERE d.id = $1 AND t.user_id = $2`,
      [dayId, userId]
    );

    if (dayResult.rows.length === 0) {
      return res.status(404).json({ message: 'Day not found' });
    }

    // Update stop orders
    for (const { id, orderIndex } of stopOrders) {
      await query(
        `UPDATE stops 
         SET order_index = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 AND day_id = $3`,
        [orderIndex, id, dayId]
      );
    }

    res.json({ message: 'Stops reordered successfully' });
  } catch (error) {
    console.error('Reorder stops error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getStopsByDay,
  getStopById,
  createStop,
  updateStop,
  deleteStop,
  reorderStops
};