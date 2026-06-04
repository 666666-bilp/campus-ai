const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { success, error } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';

/**
 * Generate a signed JWT for the given user.
 * @param {Object} user - Mongoose user document.
 * @returns {string}
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
}

/**
 * POST /api/auth/register
 * Create a new user account and return a JWT.
 */
async function register(req, res, next) {
  try {
    const { email, username, password } = req.body;

    // --- Validation ---
    if (!email || !username || !password) {
      return error(res, 'Email, username, and password are required.', 400);
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return error(res, 'Please provide a valid email address.', 400);
    }

    if (username.length < 2 || username.length > 30) {
      return error(res, 'Username must be between 2 and 30 characters.', 400);
    }

    const usernameRegex = /^[a-zA-Z0-9_一-鿿]+$/;
    if (!usernameRegex.test(username)) {
      return error(res, 'Username can only contain letters, numbers, underscores, and Chinese characters.', 400);
    }

    if (password.length < 6) {
      return error(res, 'Password must be at least 6 characters.', 400);
    }

    // --- Uniqueness checks ---
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return error(res, 'A user with this email already exists.', 409);
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return error(res, 'This username is already taken.', 409);
    }

    // --- Create user ---
    const user = await User.create({
      email: email.toLowerCase(),
      username,
      password,
    });

    // --- Generate JWT ---
    const token = generateToken(user);

    return success(res, { user: user.toSafeObject(), token }, 'Registration successful.', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Authenticate user credentials and return a JWT.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Email and password are required.', 400);
    }

    // password is select:false on the schema, so we must explicitly include it
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return error(res, 'Invalid email or password.', 401);
    }

    if (!user.isActive) {
      return error(res, 'This account has been deactivated. Please contact support.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return error(res, 'Invalid email or password.', 401);
    }

    // Update login stats
    await user.recordLogin();

    const token = generateToken(user);

    return success(res, { user: user.toSafeObject(), token }, 'Login successful.');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Stateless JWT — no server-side invalidation needed.
 * The client should discard the token.
 */
async function logout(req, res, next) {
  try {
    return success(res, null, 'Logged out successfully. Please discard your token on the client.');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Return the currently authenticated user (attached by auth middleware).
 */
async function getMe(req, res, next) {
  try {
    return success(res, req.user, 'Current user retrieved successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/auth/profile
 * Update profile fields for the authenticated user.
 */
async function updateProfile(req, res, next) {
  try {
    const { username, university, major, grade, bio, avatar } = req.body;

    // Check username uniqueness if it is being changed
    if (username && username !== req.user.username) {
      const existing = await User.findOne({ username });
      if (existing) {
        return error(res, 'This username is already taken.', 409);
      }
      req.user.username = username;
    }

    // Update profile nested fields if provided
    if (university !== undefined) req.user.profile.university = university;
    if (major !== undefined) req.user.profile.major = major;
    if (grade !== undefined) req.user.profile.grade = grade;
    if (bio !== undefined) req.user.profile.bio = bio;
    if (avatar !== undefined) req.user.profile.avatar = avatar;

    await req.user.save();

    return success(res, req.user.toSafeObject(), 'Profile updated successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/auth/preferences
 * Update UI preferences (theme, language).
 */
async function updatePreferences(req, res, next) {
  try {
    const { theme, language } = req.body;

    const validThemes = ['light', 'dark'];
    const validLanguages = ['zh-CN', 'en-US'];

    if (theme !== undefined) {
      if (!validThemes.includes(theme)) {
        return error(res, `Theme must be one of: ${validThemes.join(', ')}.`, 400);
      }
      req.user.preferences.theme = theme;
    }

    if (language !== undefined) {
      if (!validLanguages.includes(language)) {
        return error(res, `Language must be one of: ${validLanguages.join(', ')}.`, 400);
      }
      req.user.preferences.language = language;
    }

    await req.user.save();

    return success(res, req.user.toSafeObject(), 'Preferences updated successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/auth/password
 * Change the authenticated user's password.
 */
async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return error(res, 'Both oldPassword and newPassword are required.', 400);
    }

    if (newPassword.length < 6) {
      return error(res, 'New password must be at least 6 characters.', 400);
    }

    if (oldPassword === newPassword) {
      return error(res, 'New password must be different from the old password.', 400);
    }

    // Fetch the user with the password field included
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return error(res, 'User not found.', 404);
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return error(res, 'Old password is incorrect.', 401);
    }

    user.password = newPassword;
    await user.save();

    return success(res, null, 'Password changed successfully.');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updatePreferences,
  changePassword,
};
