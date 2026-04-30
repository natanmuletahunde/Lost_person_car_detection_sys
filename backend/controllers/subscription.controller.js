const Subscription = require('../models/Subscription');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');

const createSubscription = async (req, res, next) => {
  try {
    const { plan, duration, paymentMethod, paymentToken } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    const existingSub = await Subscription.findOne({ userId, status: 'active' });
    if (existingSub) {
      return ApiResponse.error(res, 'User already has active subscription', 400);
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (duration || 1));

    const subscription = new Subscription({
      userId,
      plan: plan || 'basic',
      duration: duration || 1,
      startDate,
      endDate,
      status: 'active',
      paymentMethod: paymentMethod || 'card',
      autoRenew: true
    });

    await subscription.save();

    user.subscription = {
      plan: subscription.plan,
      status: 'active',
      startDate: subscription.startDate,
      endDate: subscription.endDate
    };
    await user.save();

    return ApiResponse.success(res, 'Subscription created successfully', {
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate
      }
    }, 201);
  } catch (error) {
    next(error);
  }
};

const getMySubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const subscription = await Subscription.findOne({ userId, status: 'active' })
      .sort({ createdAt: -1 });

    if (!subscription) {
      return ApiResponse.success(res, 'No active subscription', {
        subscription: null,
        hasActivePlan: false
      });
    }

    const isExpiringSoon = new Date(subscription.endDate) - new Date() < 7 * 24 * 60 * 60 * 1000;

    return ApiResponse.success(res, 'Subscription retrieved', {
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        autoRenew: subscription.autoRenew,
        paymentMethod: subscription.paymentMethod
      },
      hasActivePlan: subscription.status === 'active',
      isExpiringSoon
    });
  } catch (error) {
    next(error);
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const subscription = await Subscription.findOne({ userId, status: 'active' });
    
    if (!subscription) {
      return ApiResponse.error(res, 'No active subscription found', 404);
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    await subscription.save();

    const user = await User.findById(userId);
    if (user) {
      user.subscription.status = 'cancelled';
      await user.save();
    }

    return ApiResponse.success(res, 'Subscription cancelled successfully', {
      subscription: {
        id: subscription._id,
        status: subscription.status,
        cancelledAt: subscription.cancelledAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const upgradeSubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { newPlan, duration } = req.body;
    
    const subscription = await Subscription.findOne({ userId, status: 'active' });
    
    if (!subscription) {
      return ApiResponse.error(res, 'No active subscription found', 404);
    }

    subscription.plan = newPlan;
    subscription.duration = duration || subscription.duration;
    subscription.upgradedAt = new Date();
    await subscription.save();

    const user = await User.findById(userId);
    if (user) {
      user.subscription.plan = newPlan;
      await user.save();
    }

    return ApiResponse.success(res, 'Subscription upgraded successfully', {
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        status: subscription.status
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAvailablePlans = async (req, res, next) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        duration: 'forever',
        features: [
          'Report up to 2 missing items',
          'Basic search alerts',
          'Email support'
        ],
        limitations: [
          'Limited to 2 active cases',
          'No SMS notifications'
        ]
      },
      {
        id: 'basic',
        name: 'Basic',
        price: 299,
        duration: 'month',
        features: [
          'Report up to 10 missing items',
          'Email & SMS alerts',
          'Priority support',
          'Basic analytics'
        ],
        limitations: [
          'Limited to 10 active cases'
        ]
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 799,
        duration: 'month',
        features: [
          'Unlimited case reports',
          'Real-time notifications',
          '24/7 priority support',
          'Full analytics dashboard',
          'API access',
          'Custom alerts'
        ],
        limitations: []
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 2499,
        duration: 'month',
        features: [
          'Everything in Premium',
          'Dedicated account manager',
          'Custom integrations',
          'White-label support',
          'SLA guarantee',
          'Team management'
        ],
        limitations: []
      }
    ];

    return ApiResponse.success(res, 'Available plans retrieved', { plans });
  } catch (error) {
    next(error);
  }
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const subscriptions = await Subscription.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    const history = subscriptions.map(sub => ({
      id: sub._id,
      plan: sub.plan,
      amount: sub.amount || 0,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      createdAt: sub.createdAt
    }));

    return ApiResponse.success(res, 'Payment history retrieved', { history });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubscription,
  getMySubscription,
  cancelSubscription,
  upgradeSubscription,
  getAvailablePlans,
  getPaymentHistory
};