const User = require('../models/User');
const RoleRequest = require('../models/RoleRequest');
const SystemSettings = require('../models/SystemSettings');
const { sendEmail } = require('../utils/emailUtils');

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    // Search parameter
    const search = req.query.search || '';

    // Create search query
    const searchQuery = search
      ? {
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { college: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    // Get all users matching search
    const users = await User.find(searchQuery)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by ID (admin only)
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
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
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user role (admin only)
 * @route   PUT /api/admin/users/:id/role
 * @access  Private/Admin
 */
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    
    // Validate role
    const validRoles = ['user', 'admin', 'organizer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Role must be one of: user, admin, organizer'
      });
    }
    
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent changing own role (admin can't demote themselves)
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot change your own role'
      });
    }
    
    // Update role
    user.role = role;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a role request (participant -> admin)
 * @route   POST /api/auth/role-request
 * @access  Private
 */
exports.createRoleRequest = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { message } = req.body;

    // Prevent duplicate pending requests
    const existing = await RoleRequest.findOne({ userId, status: 'pending' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A pending request already exists' });
    }

    const reqDoc = await RoleRequest.create({
      userId,
      name: `${req.user.firstName} ${req.user.lastName}`,
      email: req.user.email,
      college: req.user.college || '',
      message: message || ''
    });

    // Debug: log creation to server console for troubleshooting
    console.log(`RoleRequest created: ${reqDoc._id} by user ${req.user._id} (${req.user.email})`);

    // Notify admins via email
    try {
      // Find admin emails
      const admins = await User.find({ role: 'admin' }).select('email firstName lastName');
      let toEmails = admins.map(a => a.email).filter(Boolean);

      // Fallback to system contact email if no admins
      if (toEmails.length === 0) {
        const settings = await SystemSettings.findOne();
        if (settings && settings.contactEmail) toEmails = [settings.contactEmail];
      }

      if (toEmails.length > 0) {
        const subject = 'New Organizer Role Request';
        const text = `A new organizer role request has been submitted.\n\nName: ${reqDoc.name}\nEmail: ${reqDoc.email}\nCollege: ${reqDoc.college || 'N/A'}\nMessage: ${reqDoc.message || 'N/A'}\n\nReview it in the admin panel.`;
        const html = `<p>A new organizer role request has been submitted.</p>
          <ul>
            <li><strong>Name:</strong> ${reqDoc.name}</li>
            <li><strong>Email:</strong> ${reqDoc.email}</li>
            <li><strong>College:</strong> ${reqDoc.college || 'N/A'}</li>
            <li><strong>Message:</strong> ${reqDoc.message || 'N/A'}</li>
          </ul>
          <p>Review it in the admin panel.</p>`;

        // Send email (non-blocking for user response)
        sendEmail({ to: toEmails.join(','), subject, text, html });
      }
    } catch (err) {
      console.error('Failed to notify admins about role request:', err);
    }

    res.status(201).json({ success: true, request: reqDoc });
    // Emit socket event to admin role room so dashboards update in real-time
    try {
      if (req && req.io) {
        // Emit to the role-admin room
        req.io.to('role-admin').emit('roleRequestCreated', { id: reqDoc._id, name: reqDoc.name, email: reqDoc.email, college: reqDoc.college, createdAt: reqDoc.createdAt });
        // Also emit globally as a fallback for clients that may not have joined the room yet
        req.io.emit('roleRequestCreated', { id: reqDoc._id, name: reqDoc.name, email: reqDoc.email, college: reqDoc.college, createdAt: reqDoc.createdAt });
        console.log('Emitted roleRequestCreated to room role-admin and globally');
      } else {
        console.warn('Socket IO not available on request object; cannot emit roleRequestCreated');
      }
    } catch (err) {
      console.debug('Failed to emit roleRequestCreated socket event', err.message || err);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get role requests for current user
 * @route   GET /api/auth/role-requests
 * @access  Private
 */
exports.getMyRoleRequests = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const requests = await RoleRequest.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: requests.length, requests });
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
    res.status(200).json({ success: true, count: requests.length, requests });
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
    const { status } = req.body; // 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const reqDoc = await RoleRequest.findById(id);
    if (!reqDoc) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    reqDoc.status = status;
    await reqDoc.save();

    // If approved, update user role
    if (status === 'approved') {
      const user = await User.findById(reqDoc.userId);
      if (user) {
        user.role = 'organizer';
        await user.save();
      }
    }

    res.status(200).json({ success: true, request: reqDoc });
  } catch (error) {
    next(error);
  }
};