/**
 * Authentication Service
 * Handles user registration, login, and password validation
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.pg.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dev_key_123';
const BCRYPT_ROUNDS = 10;

/**
 * Register a new user
 */
export async function registerUser(email, password, name) {
  if (!email || !password || !name) {
    throw new Error('Email, password, and name are required');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    
    const result = await db.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('Email already exists');
    }
    throw error;
  }
}

/**
 * Login user
 */
export async function loginUser(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const result = await db.query(
    'SELECT id, email, name, password_hash FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];
  const validPassword = await bcrypt.compare(password, user.password_hash);

  if (!validPassword) {
    throw new Error('Invalid password');
  }

  const token = generateToken(user.id, user.email);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  const result = await db.query(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Generate JWT token
 */
function generateToken(userId, email) {
  return jwt.sign(
    { id: userId, email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export default {
  registerUser,
  loginUser,
  getUserById,
  verifyToken,
  generateToken,
};
