const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  createSubscription,
  getMySubscription,
  cancelSubscription,
  upgradeSubscription,
  getAvailablePlans,
  getPaymentHistory
} = require('../controllers/subscription.controller');

router.post('/', protect, createSubscription);
router.get('/my', protect, getMySubscription);
router.patch('/cancel', protect, cancelSubscription);
router.patch('/upgrade', protect, upgradeSubscription);
router.get('/plans', protect, getAvailablePlans);
router.get('/history', protect, getPaymentHistory);

module.exports = router;