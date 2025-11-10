const express = require('express');
const { 
  getAllUsers,
  getUserById,
  updateUserRole
} = require('../controllers/adminController');
const { getRoleRequests, updateRoleRequest } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/role', updateUserRole);

// Role request management
router.get('/role-requests', getRoleRequests);
router.put('/role-requests/:id', updateRoleRequest);

module.exports = router;