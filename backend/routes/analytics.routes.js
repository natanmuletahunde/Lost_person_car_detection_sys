const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getOverviewStats,
  getDistributionStats,
  getRecentActivity,
  getMonthlyTrends,
  getCommunityStats,
  getFullAnalytics
} = require('../controllers/analytics.controller');

router.get('/overview', protect, getOverviewStats);
router.get('/distribution', protect, getDistributionStats);
router.get('/activity', protect, getRecentActivity);
router.get('/trends', protect, getMonthlyTrends);
router.get('/community', protect, getCommunityStats);
router.get('/', protect, getFullAnalytics);

module.exports = router;