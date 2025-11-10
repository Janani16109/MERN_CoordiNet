const express = require('express');
const { 
  getAllUsers,
  getUserById,
  updateUserRole,
  getRoleRequests,
  updateRoleRequest
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/role', updateUserRole);
// Admin: view role requests
router.get('/role-requests', getRoleRequests);
// Admin: update (approve/reject) a role request
router.put('/role-requests/:id', updateRoleRequest);

module.exports = router;