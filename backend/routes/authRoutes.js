const express = require('express');
const { 
  register, 
  login, 
  getCurrentUser, 
  refreshToken, 
  logout,
  forgotPassword,
  resetPassword,
  updateProfile,
  googleAuth
} = require('../controllers/authController');
const { createRoleRequest, getMyRoleRequests } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/google', googleAuth);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.post('/logout', protect, logout);
router.put('/profile', protect, updateProfile);
// Role request for participants
router.post('/role-request', protect, createRoleRequest);
// Get current user's role requests
router.get('/role-requests', protect, getMyRoleRequests);

module.exports = router;