const { validationResult } = require('express-validator');
const { query } = require('../config/database');

const getPackingTemplates = async (req, res) => {
  try {
    const { tripType, climate, public: isPublic } = req.query;
    
    const whereConditions = [];
    const queryParams = [];
    let paramCount = 1;

    if (isPublic === 'true') {
      whereConditions.push('pt.is_public = true');
    }

    if (tripType) {
      whereConditions.push(`pt.trip_type = $${paramCount}`);
      queryParams.push(tripType);
      paramCount++;
    }

    if (climate) {
      whereConditions.push(`pt.climate = $${paramCount}`);
      queryParams.push(climate);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT pt.*, u.first_name, u.last_name,
              COUNT(pi.id) as item_count
       FROM packing_templates pt
       LEFT JOIN users u ON pt.created_by = u.id
       LEFT JOIN packing_items pi ON pt.id = pi.template_id
       ${whereClause}
       GROUP BY pt.id, u.first_name, u.last_name
       ORDER BY pt.created_at DESC`,
      queryParams
    );

    res.json({ templates: result.rows });
  } catch (error) {
    console.error('Get packing templates error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTemplateById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const templateResult = await query(
      `SELECT pt.*, u.first_name, u.last_name
       FROM packing_templates pt
       LEFT JOIN users u ON pt.created_by = u.id
       WHERE pt.id = $1`,
      [id]
    );

    if (templateResult.rows.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const template = templateResult.rows[0];

    // Get items for the template
    const itemsResult = await query(
      'SELECT * FROM packing_items WHERE template_id = $1 ORDER BY category, name',
      [id]
    );

    template.items = itemsResult.rows;

    res.json({ template });
  } catch (error) {
    console.error('Get template by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      tripType,
      climate,
      durationDays,
      isPublic = false,
      items
    } = req.body;
    const userId = req.user.id;

    // Create template
    const templateResult = await query(
      `INSERT INTO packing_templates (
        name, description, trip_type, climate, duration_days, is_public, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [name, description, tripType, climate, durationDays, isPublic, userId]
    );

    const template = templateResult.rows[0];

    // Add items to template
    const itemPromises = items.map(item => 
      query(
        `INSERT INTO packing_items (
          template_id, name, category, quantity, is_essential, notes
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          template.id,
          item.name,
          item.category || 'general',
          item.quantity || 1,
          item.isEssential || false,
          item.notes
        ]
      )
    );

    const itemResults = await Promise.all(itemPromises);
    template.items = itemResults.map(result => result.rows[0]);

    res.status(201).json({
      message: 'Packing template created successfully',
      template
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const applyTemplateToTrip = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tripId } = req.params;
    const { templateId } = req.body;
    const userId = req.user.id;

    // Verify user owns the trip
    const tripResult = await query(
      'SELECT id FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, userId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Get template items
    const itemsResult = await query(
      'SELECT * FROM packing_items WHERE template_id = $1',
      [templateId]
    );

    if (itemsResult.rows.length === 0) {
      return res.status(404).json({ message: 'Template not found or has no items' });
    }

    // Copy template items to trip
    const itemPromises = itemsResult.rows.map(item => 
      query(
        `INSERT INTO packing_items (
          trip_id, name, category, quantity, is_essential, notes
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [tripId, item.name, item.category, item.quantity, item.is_essential, item.notes]
      )
    );

    const copiedItemResults = await Promise.all(itemPromises);
    const copiedItems = copiedItemResults.map(result => result.rows[0]);

    res.json({
      message: 'Template applied to trip successfully',
      itemsAdded: copiedItems.length,
      items: copiedItems
    });
  } catch (error) {
    console.error('Apply template to trip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTripPackingList = async (req, res) => {
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
      'SELECT * FROM packing_items WHERE trip_id = $1 ORDER BY category, name',
      [tripId]
    );

    res.json({ packingList: result.rows });
  } catch (error) {
    console.error('Get trip packing list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const addPackingItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tripId } = req.params;
    const { name, category, quantity, isEssential, notes } = req.body;
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
      `INSERT INTO packing_items (
        trip_id, name, category, quantity, is_essential, notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [tripId, name, category || 'general', quantity || 1, isEssential || false, notes]
    );

    res.status(201).json({
      message: 'Packing item added successfully',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Add packing item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updatePackingItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;

    // Verify user owns the item
    const itemResult = await query(
      `SELECT pi.id 
       FROM packing_items pi
       LEFT JOIN trips t ON pi.trip_id = t.id
       WHERE pi.id = $1 AND (t.user_id = $2 OR pi.trip_id IS NULL)`,
      [id, userId]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ message: 'Packing item not found' });
    }

    // Build dynamic update query
    const allowedFields = ['name', 'category', 'quantity', 'is_essential', 'is_packed', 'notes'];
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
      `UPDATE packing_items SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      updateValues
    );

    res.json({
      message: 'Packing item updated successfully',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Update packing item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deletePackingItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      `DELETE FROM packing_items 
       WHERE id = $1 AND EXISTS (
         SELECT 1 FROM trips t 
         WHERE t.id = packing_items.trip_id AND t.user_id = $2
       )
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Packing item not found' });
    }

    res.json({ message: 'Packing item deleted successfully' });
  } catch (error) {
    console.error('Delete packing item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getPackingTemplates,
  getTemplateById,
  createTemplate,
  applyTemplateToTrip,
  getTripPackingList,
  addPackingItem,
  updatePackingItem,
  deletePackingItem
};