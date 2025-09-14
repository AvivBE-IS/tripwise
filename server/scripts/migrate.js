const { query } = require('../config/database');

const createTables = async () => {
  try {
    // Enable UUID extension
    await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        profile_picture VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Trips table
    await query(`
      CREATE TABLE IF NOT EXISTS trips (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        destination VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        budget DECIMAL(10,2),
        currency VARCHAR(3) DEFAULT 'USD',
        is_public BOOLEAN DEFAULT false,
        share_token VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Days table
    await query(`
      CREATE TABLE IF NOT EXISTS days (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        title VARCHAR(255),
        notes TEXT,
        day_number INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(trip_id, day_number)
      )
    `);

    // Stops table
    await query(`
      CREATE TABLE IF NOT EXISTS stops (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        day_id UUID NOT NULL REFERENCES days(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        address VARCHAR(500),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        stop_type VARCHAR(50) DEFAULT 'attraction',
        start_time TIME,
        end_time TIME,
        duration_minutes INTEGER,
        cost DECIMAL(10,2),
        notes TEXT,
        order_index INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Packing templates table
    await query(`
      CREATE TABLE IF NOT EXISTS packing_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        trip_type VARCHAR(100),
        climate VARCHAR(50),
        duration_days INTEGER,
        is_public BOOLEAN DEFAULT false,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Packing items table
    await query(`
      CREATE TABLE IF NOT EXISTS packing_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        template_id UUID REFERENCES packing_templates(id) ON DELETE CASCADE,
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        quantity INTEGER DEFAULT 1,
        is_essential BOOLEAN DEFAULT false,
        is_packed BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (template_id IS NOT NULL OR trip_id IS NOT NULL)
      )
    `);

    // Weather cache table
    await query(`
      CREATE TABLE IF NOT EXISTS weather_cache (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        location VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        weather_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(location, date)
      )
    `);

    // Flight status table
    await query(`
      CREATE TABLE IF NOT EXISTS flight_status (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
        flight_number VARCHAR(20) NOT NULL,
        airline VARCHAR(100),
        departure_airport VARCHAR(10),
        arrival_airport VARCHAR(10),
        scheduled_departure TIMESTAMP,
        actual_departure TIMESTAMP,
        scheduled_arrival TIMESTAMP,
        actual_arrival TIMESTAMP,
        status VARCHAR(50),
        gate VARCHAR(10),
        terminal VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await query('CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_days_trip_id ON days(trip_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_stops_day_id ON stops(day_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_packing_items_template_id ON packing_items(template_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_packing_items_trip_id ON packing_items(trip_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_weather_cache_location_date ON weather_cache(location, date)');
    await query('CREATE INDEX IF NOT EXISTS idx_flight_status_trip_id ON flight_status(trip_id)');

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

module.exports = { createTables };