const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user authentication
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
exports.generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

/**
 * Generate refresh token with longer expiry
 * @param {Object} user - User object
 * @returns {String} Refresh token
 */
exports.generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Verify refresh token
 * @param {String} refreshToken - Refresh token to verify
 * @returns {Object} Decoded token payload
 */
exports.verifyRefreshToken = (refreshToken) => {
  return jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
  );
};