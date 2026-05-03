const User = require('../models/User');
const Sighting = require('../models/Sighting');
const Alert = require('../models/Alert');
const Subscription = require('../models/Subscription');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/helpers');
const bcrypt = require('bcrypt');
const config = require('../config');

const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, role, isActive } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiResponse.error(res, 'User with this email already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);

    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role: role || 'user',
      isActive: isActive !== undefined ? isActive : true,
    });

    await user.save();

    return ApiResponse.success(res, 'User created successfully', {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    }, 201);
  } catch (error) {
    next(error);
  }
};

const checkUserExists = async (req, res, next) => {
  try {
    const { email, phone } = req.query;
    
    const query = {};
    if (email) query.email = email;
    if (phone) query.phone = phone;
    
    if (!email && !phone) {
      return ApiResponse.error(res, 'Email or phone is required', 400);
    }

    const user = await User.findOne(query).select('+password');
    
    return ApiResponse.success(res, 'User check result', {
      exists: !!user,
      user: user ? { 
        id: user._id, 
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email, 
        phone: user.phone,
        password: user.password,
        role: user.role 
      } : null
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { role, isActive, search } = req.query;

    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await paginate(User.find(query), page, limit).sort('-createdAt');

    return ApiResponse.paginated(res, 'Users retrieved successfully', users, page, limit, total);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    return ApiResponse.success(res, 'User retrieved successfully', { user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { role, isActive, firstName, lastName, phone, address } = req.body;

    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    return ApiResponse.success(res, 'User updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    return ApiResponse.success(res, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });

    const totalSightings = await Sighting.countDocuments();
    const recentSightings = await Sighting.find()
      .sort('-reportedAt')
      .limit(5)
      .populate('user', 'firstName lastName');

    const activeAlerts = await Alert.countDocuments({ status: 'active' });

    return ApiResponse.success(res, 'Dashboard stats retrieved successfully', {
      users: {
        total: totalUsers,
        active: activeUsers,
        admins: adminUsers,
      },
      sightings: {
        total: totalSightings,
        recent: recentSightings,
      },
      alerts: {
        active: activeAlerts,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  checkUserExists,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
};
