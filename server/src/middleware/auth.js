const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { error: errorResponse } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a JWT token for a user.
 * @param {Object} user - Mongoose user document.
 * @returns {string} JWT token.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Required authentication middleware.
 * Verifies JWT from Authorization header and attaches user to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication required. Please provide a valid token.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, 'Authentication required. Please provide a valid token.', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return errorResponse(res, 'User not found. The token may be invalid.', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token.', 401);
    }
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token has expired. Please log in again.', 401);
    }
    next(err);
  }
}

/**
 * Optional authentication middleware.
 * Attaches user to req.user if token is present and valid, otherwise continues.
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user) {
      req.user = user;
    }
    next();
  } catch {
    // Token invalid or expired - continue without user
    next();
  }
}

module.exports = { authenticate, optionalAuth, generateToken, JWT_SECRET, JWT_EXPIRES_IN };
