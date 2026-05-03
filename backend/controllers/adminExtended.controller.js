const User = require('../models/User');
const MissingPerson = require('../models/MissingPerson');
const MissingVehicle = require('../models/MissingVehicle');
const Sighting = require('../models/Sighting');
const Subscription = require('../models/Subscription');
const Feedback = require('../models/Feedback');
const Alert = require('../models/Alert');
const ApiResponse = require('../utils/ApiResponse');

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .select('-password'),
      User.countDocuments(query)
    ]);

    return ApiResponse.success(res, 'Users retrieved', {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    const [reportedPersons, reportedVehicles] = await Promise.all([
      MissingPerson.find({ 'reportedBy.userId': user._id }),
      MissingVehicle.find({ 'reportedBy.userId': user._id })
    ]);

    return ApiResponse.success(res, 'User retrieved', {
      user,
      stats: {
        reportedPersons: reportedPersons.length,
        reportedVehicles: reportedVehicles.length,
        totalCases: reportedPersons.length + reportedVehicles.length
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, status, firstName, lastName, phone } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    if (role) user.role = role;
    if (status) user.status = status;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;

    await user.save();

    return ApiResponse.success(res, 'User updated successfully', {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    if (user.role === 'admin') {
      return ApiResponse.error(res, 'Cannot delete admin users', 403);
    }

    await User.findByIdAndDelete(id);

    return ApiResponse.success(res, 'User deleted successfully', {});
  } catch (error) {
    next(error);
  }
};

const getAllCases = async (req, res, next) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let persons, vehicles, total;

    if (type === 'person') {
      const query = status ? { status } : {};
      [persons, total] = await Promise.all([
        MissingPerson.find(query).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
        MissingPerson.countDocuments(query)
      ]);
      return ApiResponse.success(res, 'Cases retrieved', {
        cases: persons.map(p => ({ ...p.toObject(), caseType: 'person' })),
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
      });
    } else if (type === 'vehicle') {
      const query = status ? { status } : {};
      [vehicles, total] = await Promise.all([
        MissingVehicle.find(query).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
        MissingVehicle.countDocuments(query)
      ]);
      return ApiResponse.success(res, 'Cases retrieved', {
        cases: vehicles.map(v => ({ ...v.toObject(), caseType: 'vehicle' })),
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
      });
    } else {
      const [allPersons, allVehicles] = await Promise.all([
        MissingPerson.find().skip(skip).limit(parseInt(limit)),
        MissingVehicle.find().skip(skip).limit(parseInt(limit))
      ]);
      total = await MissingPerson.countDocuments() + await MissingVehicle.countDocuments();
      
      const combined = [
        ...allPersons.map(p => ({ ...p.toObject(), caseType: 'person' })),
        ...allVehicles.map(v => ({ ...v.toObject(), caseType: 'vehicle' }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return ApiResponse.success(res, 'All cases retrieved', {
        cases: combined,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
      });
    }
  } catch (error) {
    next(error);
  }
};

const updateCaseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, status } = req.body;

    if (!type || !status) {
      return ApiResponse.error(res, 'Missing type or status', 400);
    }

    let model;
    if (type === 'person') {
      model = MissingPerson;
    } else if (type === 'vehicle') {
      model = MissingVehicle;
    } else {
      return ApiResponse.error(res, 'Invalid type', 400);
    }

    const caseItem = await model.findById(id);
    if (!caseItem) {
      return ApiResponse.error(res, 'Case not found', 404);
    }

    caseItem.status = status;
    await caseItem.save();

    return ApiResponse.success(res, 'Case status updated', {
      case: {
        id: caseItem._id,
        caseId: caseItem.caseId,
        status: caseItem.status
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCaseDetail = async (req, res, next) => {
  try {
    const { id, type } = req.params;

    if (!type) {
      return ApiResponse.error(res, 'Missing type parameter', 400);
    }

    let model;
    if (type === 'person') {
      model = MissingPerson;
    } else if (type === 'vehicle') {
      model = MissingVehicle;
    } else {
      return ApiResponse.error(res, 'Invalid type', 400);
    }

    const caseItem = await model.findById(id);
    if (!caseItem) {
      return ApiResponse.error(res, 'Case not found', 404);
    }

    const sightings = await Sighting.find({ originalCaseId: caseItem.caseId })
      .sort({ createdAt: -1 })
      .limit(10);

    return ApiResponse.success(res, 'Case detail retrieved', {
      case: { ...caseItem.toObject(), caseType: type },
      sightings
    });
  } catch (error) {
    next(error);
  }
};

const getFinanceStats = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;

    let dateFilter = new Date();
    switch (period) {
      case '7d': dateFilter.setDate(dateFilter.getDate() - 7); break;
      case '30d': dateFilter.setDate(dateFilter.getDate() - 30); break;
      case '90d': dateFilter.setDate(dateFilter.getDate() - 90); break;
      case '1y': dateFilter.setFullYear(dateFilter.getFullYear() - 1); break;
      default: dateFilter.setDate(dateFilter.getDate() - 30);
    }

    const subscriptions = await Subscription.find({
      createdAt: { $gte: dateFilter }
    });

    const revenueByPlan = {};
    let totalRevenue = 0;
    subscriptions.forEach(sub => {
      const amount = sub.amount || 0;
      totalRevenue += amount;
      revenueByPlan[sub.plan] = (revenueByPlan[sub.plan] || 0) + amount;
    });

    const revenueByMonth = {};
    subscriptions.forEach(sub => {
      const month = sub.createdAt.toLocaleString('default', { month: 'short' });
      revenueByMonth[month] = (revenueByMonth[month] || 0) + (sub.amount || 0);
    });

    const totalUsers = await User.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

    return ApiResponse.success(res, 'Finance stats retrieved', {
      revenue: {
        total: totalRevenue,
        byPlan: revenueByPlan,
        byMonth: revenueByMonth
      },
      subscriptions: {
        total: subscriptions.length,
        active: activeSubscriptions,
        churnRate: activeSubscriptions > 0 ? ((subscriptions.length - activeSubscriptions) / subscriptions.length * 100).toFixed(1) : 0
      },
      users: {
        total: totalUsers,
        conversionRate: totalUsers > 0 ? ((activeSubscriptions / totalUsers) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllFeedback = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, rating, type } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (rating) query.rating = parseInt(rating);
    if (type) query.type = type;

    const [feedback, total] = await Promise.all([
      Feedback.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate('userId', 'firstName lastName email'),
      Feedback.countDocuments(query)
    ]);

    const avgRating = await Feedback.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    return ApiResponse.success(res, 'Feedback retrieved', {
      feedback,
      avgRating: avgRating[0]?.avg || 0,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const respondToFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return ApiResponse.error(res, 'Feedback not found', 404);
    }

    feedback.response = response;
    feedback.respondedBy = req.user._id;
    feedback.respondedAt = new Date();
    await feedback.save();

    return ApiResponse.success(res, 'Feedback responded to', { feedback });
  } catch (error) {
    next(error);
  }
};

const sendBulkNotification = async (req, res, next) => {
  try {
    const { userIds, roles, message, title, type = 'general' } = req.body;

    if (!message) {
      return ApiResponse.error(res, 'Message is required', 400);
    }

    let targetUsers = [];
    if (userIds && userIds.length > 0) {
      targetUsers = await User.find({ _id: { $in: userIds } });
    } else if (roles && roles.length > 0) {
      targetUsers = await User.find({ role: { $in: roles } });
    } else {
      targetUsers = await User.find();
    }

    const alerts = targetUsers.map(user => ({
      userId: user._id,
      type,
      title: title || 'Notification',
      message,
      status: 'unread',
      createdAt: new Date()
    }));

    if (alerts.length > 0) {
      await Alert.insertMany(alerts);
    }

    return ApiResponse.success(res, 'Bulk notifications sent', {
      sent: alerts.length,
      recipients: targetUsers.map(u => u.email)
    });
  } catch (error) {
    next(error);
  }
};

const getNotificationsSettings = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('email phone notifications emailNotifications smsNotifications telegram telegramChatId')
      .sort({ createdAt: -1 });

    const settings = users.map(u => ({
      id: u._id,
      email: u.email,
      phone: u.phone,
      emailNotifications: u.notifications?.email ?? true,
      smsNotifications: u.notifications?.sms ?? false,
      telegram: !!u.telegramChatId
    }));

    return ApiResponse.success(res, 'Notification settings retrieved', { settings });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalCases,
      activeCases,
      resolvedCases,
      totalSightings,
      totalFeedback
    ] = await Promise.all([
      User.countDocuments(),
      MissingPerson.countDocuments() + MissingVehicle.countDocuments(),
      MissingPerson.countDocuments({ status: 'Active' }) + MissingVehicle.countDocuments({ status: 'Active' }),
      MissingPerson.countDocuments({ status: 'Resolved' }) + MissingVehicle.countDocuments({ status: 'Resolved' }),
      Sighting.countDocuments(),
      Feedback.countDocuments()
    ]);

    return ApiResponse.success(res, 'Dashboard stats retrieved', {
      stats: {
        totalUsers,
        totalCases,
        activeCases,
        resolvedCases,
        totalSightings,
        totalFeedback,
        resolutionRate: totalCases > 0 ? ((resolvedCases / totalCases) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllCases,
  updateCaseStatus,
  getCaseDetail,
  getFinanceStats,
  getAllFeedback,
  respondToFeedback,
  sendBulkNotification,
  getNotificationsSettings,
  getDashboardStats
};