/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user to request
 */

import authService from '../services/authService.js';

/**
 * Middleware to verify JWT token
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const user = authService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export function authenticateTokenOptional(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const user = authService.verifyToken(token);
      req.user = user;
    } catch (error) {
      console.log('[AUTH] Invalid token (optional):', error.message);
    }
  }

  next();
}

export default { authenticateToken, authenticateTokenOptional };
