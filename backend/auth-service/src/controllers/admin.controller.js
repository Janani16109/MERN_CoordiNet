const User = require('../models/User');
const RoleRequest = require('../models/RoleRequest');

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    // Get all users, excluding password field
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin only)
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user role
 * @route   PUT /api/admin/users/:id/role
 * @access  Private (Admin only)
 */
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    // Validate role
    const validRoles = ['participant', 'organizer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Role must be one of: participant, organizer, admin'
      });
    }

    // Find user and update role
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a role request (participant requests organizer role)
 * @route   POST /api/auth/role-request
 * @access  Private
 */
exports.createRoleRequest = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { email, name, college } = req.body;

    // Prevent duplicate pending requests
    const existing = await RoleRequest.findOne({ userId, status: 'pending' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a pending role request' });
    }

    const reqDoc = await RoleRequest.create({
      userId,
      email,
      name,
      college,
      requestedRole: 'organizer'
    });

    res.status(201).json({ success: true, data: reqDoc });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all role requests (admin)
 * @route   GET /api/admin/role-requests
 * @access  Private/Admin
 */
exports.getRoleRequests = async (req, res, next) => {
  try {
    const requests = await RoleRequest.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a role request (approve/reject)
 * @route   PUT /api/admin/role-requests/:id
 * @access  Private/Admin
 */
exports.updateRoleRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // expected 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const reqDoc = await RoleRequest.findById(id);
    if (!reqDoc) {
      return res.status(404).json({ success: false, message: 'Role request not found' });
    }

    reqDoc.status = status;
    reqDoc.handledBy = req.user.id || req.user._id;
    reqDoc.handledAt = Date.now();
    await reqDoc.save();

    // If approved, update the user's role
    if (status === 'approved') {
      const user = await User.findById(reqDoc.userId);
      if (user) {
        user.role = 'organizer';
        await user.save();
      }
    }

    res.status(200).json({ success: true, data: reqDoc });
  } catch (error) {
    next(error);
  }
};