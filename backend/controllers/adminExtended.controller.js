const User = require('../models/User');
const MissingPerson = require('../models/MissingPerson');
const MissingVehicle = require('../models/MissingVehicle');
const Sighting = require('../models/Sighting');
const Subscription = require('../models/Subscription');
const Feedback = require('../models/Feedback');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const Detection = require('../models/Detection');
const ApiResponse = require('../utils/ApiResponse');

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (role) query.role = role;
    if (status) {
      const s = String(status).toLowerCase();
      if (s === 'active') query.isActive = true;
      else if (s === 'inactive') query.isActive = false;
    }
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
    const { role, isActive, firstName, lastName, phone, address, email } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    if (role !== undefined && role !== null) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (email !== undefined) user.email = email;

    await user.save();

    const safe = await User.findById(id).select('-password');
    return ApiResponse.success(res, 'User updated successfully', { user: safe });
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

const getPendingVehicleValidations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const query = { verificationStatus: 'Pending', ownershipDocumentUrl: { $exists: true, $ne: [] } };
    
    if (search) {
      query.$or = [
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { plateNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const [vehicles, total] = await Promise.all([
      MissingVehicle.find(query).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      MissingVehicle.countDocuments(query)
    ]);

    return ApiResponse.success(res, 'Pending vehicles retrieved', {
      vehicles,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const verifyVehicleDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return ApiResponse.error(res, 'Invalid action', 400);
    }

    const vehicle = await MissingVehicle.findById(id);
    if (!vehicle) {
      return ApiResponse.error(res, 'Vehicle not found', 404);
    }

    if (action === 'approve') {
      vehicle.verificationStatus = 'Verified';
      vehicle.verified = true;
      vehicle.status = 'Active';
    } else {
      vehicle.verificationStatus = 'Rejected';
      vehicle.verified = false;
      vehicle.status = 'Rejected';
      if (reason) {
        vehicle.notes.push({ text: `Document rejected: ${reason}`, addedAt: new Date() });
      }
    }

    await vehicle.save();

    // Send in-app notification to the reporter
    const reporterUserId = vehicle.reportedBy?.userId;
    if (reporterUserId) {
      const vehicleName = [vehicle.brand, vehicle.model].filter(Boolean).join(' ') || 'Your vehicle';
      const plateInfo = vehicle.plateNumber ? ` (${vehicle.plateNumber})` : '';

      const notificationTitle = action === 'approve'
        ? '✅ Ownership Document Approved'
        : '❌ Ownership Document Rejected';

      const notificationMessage = action === 'approve'
        ? `Your ownership document for ${vehicleName}${plateInfo} has been reviewed and approved. Your case is now fully verified.`
        : `Your ownership document for ${vehicleName}${plateInfo} has been reviewed and rejected.${reason ? ` Reason: ${reason}` : ' Please re-upload a valid ownership document.'}`;

      await Notification.create({
        recipient: reporterUserId,
        title: notificationTitle,
        message: notificationMessage,
        type: action === 'approve' ? 'success' : 'warning',
        priority: 'high',
      });
    }

    return ApiResponse.success(res, `Vehicle document ${action}d successfully`, { vehicle });
  } catch (error) {
    next(error);
  }
};

const verifyCase = async (req, res, next) => {
  try {
    const { id, type } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return ApiResponse.error(res, 'Invalid action', 400);
    }

    let model;
    if (type === 'person') model = MissingPerson;
    else if (type === 'vehicle') model = MissingVehicle;
    else return ApiResponse.error(res, 'Invalid type', 400);

    const caseItem = await model.findById(id);
    if (!caseItem) return ApiResponse.error(res, 'Case not found', 404);

    caseItem.verified = action === 'approve';
    caseItem.status = action === 'approve' ? 'Active' : 'Rejected';
    await caseItem.save();

    // Notify the reporter
    const reporterUserId = caseItem.reportedBy?.userId;
    if (reporterUserId) {
      const caseName = type === 'vehicle'
        ? `${caseItem.brand || ''} ${caseItem.model || ''}`.trim() || 'Your vehicle'
        : `${caseItem.firstName || ''} ${caseItem.lastName || ''}`.trim() || 'Your person report';

      await Notification.create({
        recipient: reporterUserId,
        title: action === 'approve' ? '✅ Report Approved' : '❌ Report Rejected',
        message: action === 'approve'
          ? `Your report for "${caseName}" has been approved and is now visible to the public.`
          : `Your report for "${caseName}" has been reviewed and not approved. Please contact support if you believe this is a mistake.`,
        type: action === 'approve' ? 'success' : 'warning',
        priority: 'high',
      });
    }

    return ApiResponse.success(res, `Case ${action}d successfully`, { caseItem });
  } catch (error) {
    next(error);
  }
};

const deleteCase = async (req, res, next) => {
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

    await model.findByIdAndDelete(id);

    // Also delete associated sightings and detections
    await Sighting.deleteMany({ caseId: id });
    if (type === 'person') {
      await Detection.deleteMany({ registrationId: id });
    }

    return ApiResponse.success(res, 'Case deleted successfully', {});
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
        .populate('user', 'firstName lastName email'),
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
    const { response: responseText, text, status } = req.body;
    const message = responseText ?? text;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return ApiResponse.error(res, 'Feedback not found', 404);
    }

    feedback.response = {
      text: message,
      respondedBy: req.user._id,
      respondedAt: new Date(),
    };
    if (status) feedback.status = status;
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

    const notifications = targetUsers.map(user => ({
      recipient: user._id,
      title: title || 'Notification',
      message,
      type: type || 'general',
      priority: 'normal',
      isRead: false
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return ApiResponse.success(res, 'Bulk notifications sent', {
      sent: notifications.length,
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
      missingPersonCount,
      missingVehicleCount,
      activePersons,
      activeVehicles,
      resolvedPersons,
      resolvedVehicles,
      totalSightings,
      totalFeedback
    ] = await Promise.all([
      User.countDocuments(),
      MissingPerson.countDocuments(),
      MissingVehicle.countDocuments(),
      MissingPerson.countDocuments({ status: 'Active' }),
      MissingVehicle.countDocuments({ status: 'Active' }),
      MissingPerson.countDocuments({ status: 'Resolved' }),
      MissingVehicle.countDocuments({ status: 'Resolved' }),
      Sighting.countDocuments(),
      Feedback.countDocuments()
    ]);
    const activeCases = activePersons + activeVehicles;
    const resolvedCases = resolvedPersons + resolvedVehicles;
    const totalCases = missingPersonCount + missingVehicleCount;

    // --- Calculate weekly stats for the last 7 days ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [recentPersons, recentVehicles, recentSubscriptions] = await Promise.all([
      MissingPerson.find({ createdAt: { $gte: sevenDaysAgo } }).select('createdAt'),
      MissingVehicle.find({ createdAt: { $gte: sevenDaysAgo } }).select('createdAt'),
      Subscription.find({ createdAt: { $gte: sevenDaysAgo } }).select('createdAt amount')
    ]);

    const weeklyStatsMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      weeklyStatsMap[dayName] = { name: dayName, Subscription: 0, Registration: 0 };
    }

    [...recentPersons, ...recentVehicles].forEach(item => {
      const dayName = new Date(item.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
      if (weeklyStatsMap[dayName]) {
        weeklyStatsMap[dayName].Registration += 1;
      }
    });

    recentSubscriptions.forEach(item => {
      const dayName = new Date(item.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
      if (weeklyStatsMap[dayName]) {
        weeklyStatsMap[dayName].Subscription += item.amount || 0;
      }
    });

    const weeklyStats = Object.values(weeklyStatsMap);
    // ----------------------------------------------------

    return ApiResponse.success(res, 'Dashboard stats retrieved', {
      stats: {
        totalUsers,
        totalCases,
        missingPersonCount,
        missingVehicleCount,
        activeCases,
        resolvedCases,
        totalSightings,
        totalFeedback,
        resolutionRate: totalCases > 0 ? ((resolvedCases / totalCases) * 100).toFixed(1) : 0,
        weeklyStats
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
  deleteCase,
  getFinanceStats,
  getAllFeedback,
  respondToFeedback,
  sendBulkNotification,
  getNotificationsSettings,
  getDashboardStats,
  getPendingVehicleValidations,
  verifyVehicleDocument,
  verifyCase
};