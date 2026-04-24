/**
 * Database Schema Migration
 * Run this file to initialize the PostgreSQL database
 * 
 * Usage: node config/schema.js
 */

import db from './db.pg.js';

async function initializeSchema() {
  console.log('[MIGRATION] Starting database schema initialization...');

  try {
    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    console.log('[MIGRATION] ✅ Users table created');

    // Create medicines database table (for fallback/reference)
    await db.query(`
      CREATE TABLE IF NOT EXISTS medicines (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        generic_name VARCHAR(255),
        type VARCHAR(100),
        uses TEXT,
        side_effects TEXT[] DEFAULT ARRAY[]::TEXT[],
        warnings TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(LOWER(name));
      CREATE INDEX IF NOT EXISTS idx_medicines_generic ON medicines(LOWER(generic_name));
    `);
    console.log('[MIGRATION] ✅ Medicines table created');

    // Create user cabinet table (user's personal medicine list)
    await db.query(`
      CREATE TABLE IF NOT EXISTS cabinet (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        medicine_name VARCHAR(255) NOT NULL,
        dosage VARCHAR(100),
        notes TEXT,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, LOWER(medicine_name))
      );
      
      CREATE INDEX IF NOT EXISTS idx_cabinet_user ON cabinet(user_id);
      CREATE INDEX IF NOT EXISTS idx_cabinet_medicine ON cabinet(LOWER(medicine_name));
    `);
    console.log('[MIGRATION] ✅ Cabinet table created');

    // Create search history table (for analytics/optimization)
    await db.query(`
      CREATE TABLE IF NOT EXISTS search_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        query VARCHAR(255) NOT NULL,
        found_in_db BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_search_user ON search_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_search_query ON search_history(LOWER(query));
    `);
    console.log('[MIGRATION] ✅ Search history table created');

    console.log('[MIGRATION] ✅ All tables initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[MIGRATION] ❌ Schema initialization failed:', error);
    process.exit(1);
  }
}

initializeSchema();
