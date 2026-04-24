/**
 * Authentication Controller
 * Handles auth requests
 */

import authService from '../services/authService.js';

/**
 * Register user
 */
export async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;

    const result = await authService.registerUser(email, password, name);

    res.status(201).json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('[AUTH] Registration error:', error.message);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Login user
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser(email, password);

    res.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error.message);
    res.status(401).json({ error: error.message });
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(req, res, next) {
  try {
    const user = await authService.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('[AUTH] Get user error:', error.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

export default { register, login, getCurrentUser };
