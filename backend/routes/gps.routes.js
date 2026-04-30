const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  registerGpsLocation,
  trackCaseLocation,
  getAllTrackedLocations
} = require('../controllers/gps.controller');
router.post('/register', protect, registerGpsLocation);
router.get('/track/:type/:caseId', protect, trackCaseLocation);
router.get('/all', protect, getAllTrackedLocations);
module.exports = router;