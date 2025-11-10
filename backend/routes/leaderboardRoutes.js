const express = require('express');
const {
  getEventLeaderboard,
  getParticipantScore,
  updateParticipantScore,
  getTopPerformers,
  getCollegeLeaderboard
} = require('../controllers/leaderboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/event/:eventId', getEventLeaderboard);
router.get('/top', getTopPerformers);
router.get('/colleges', getCollegeLeaderboard);

// Protected routes
router.get('/event/:eventId/user/:userId', protect, getParticipantScore);
router.put('/event/:eventId/user/:userId', protect, authorize('admin', 'organizer'), updateParticipantScore);

module.exports = router;