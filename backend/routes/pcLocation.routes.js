const express = require('express');

const router = express.Router();

const {
  updateLocation,
  getLocation
} = require('../controllers/pcLocation.controller');

// ==============================
// UPDATE PC LOCATION
// ==============================
router.post('/', updateLocation);

// ==============================
// GET CURRENT LOCATION
// ==============================
router.get('/', getLocation);

module.exports = router;