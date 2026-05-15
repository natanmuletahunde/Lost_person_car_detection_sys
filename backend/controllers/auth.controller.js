const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const {
  signToken,
  signRefreshToken,
  verifyToken,
  verifyRefreshToken
} = require('../utils/jwt');


// ================= REGISTER =================
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, telegramUsername } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Phone number';
      return ApiResponse.error(res, `${field} already exists`, 400);
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      telegramUsername
    });

    const token = signToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // store refresh token safely (no validation triggers)
    await User.findByIdAndUpdate(user._id, {
      refreshToken
    });

    return ApiResponse.success(
      res,
      'User registered successfully',
      {
        user, // schema toJSON will clean sensitive fields
        token,
        refreshToken
      },
      201
    );

  } catch (error) {
    next(error);
  }
};


// ================= LOGIN =================
const login = async (req, res, next) => {
  try {
    const { loginValue, password } = req.body;

    if (!loginValue || !password) {
      return ApiResponse.error(res, 'Login value and password required', 400);
    }

    const isEmail = loginValue.includes('@');

    const user = await User.findOne(
      isEmail ? { email: loginValue } : { phone: loginValue }
    ).select('+password +refreshToken');

    if (!user) {
      return ApiResponse.error(
        res,
        `No account found with this ${isEmail ? 'email' : 'phone number'}`,
        401
      );
    }

    if (!user.isActive) {
      return ApiResponse.error(res, 'Account has been deactivated', 401);
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return ApiResponse.error(res, 'Invalid password', 401);
    }

    // update last login WITHOUT triggering hooks
    await User.findByIdAndUpdate(user._id, {
      lastLogin: new Date()
    });

    const token = signToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, {
      refreshToken
    });

    return ApiResponse.success(res, 'Login successful', {
      user, // cleaned by toJSON
      token,
      refreshToken
    });

  } catch (error) {
    next(error);
  }
};


// ================= GET ME =================
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    return ApiResponse.success(res, 'User retrieved successfully', {
      user
    });

  } catch (error) {
    next(error);
  }
};


// ================= UPDATE PROFILE =================
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, address, profileImage, telegramUsername } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (telegramUsername !== undefined) updateData.telegramUsername = telegramUsername;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    return ApiResponse.success(res, 'Profile updated successfully', {
      user
    });

  } catch (error) {
    next(error);
  }
};


// ================= CHANGE PASSWORD =================
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return ApiResponse.error(res, 'Current password is incorrect', 401);
    }

    user.password = newPassword;
    user.passwordChangedAt = Date.now();

    await user.save(); // safe now (password exists)

    return ApiResponse.success(res, 'Password changed successfully');

  } catch (error) {
    next(error);
  }
};


// ================= LOGOUT =================
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      refreshToken: null
    });

    return ApiResponse.success(res, 'Logged out successfully');

  } catch (error) {
    next(error);
  }
};


// ================= REFRESH TOKEN =================
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return ApiResponse.error(res, 'Refresh token is required', 400);
    }

    const decoded = verifyRefreshToken(token);

    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return ApiResponse.error(res, 'Invalid refresh token', 401);
    }

    const newToken = signToken(user._id);
    const newRefreshToken = signRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, {
      refreshToken: newRefreshToken
    });

    return ApiResponse.success(res, 'Token refreshed successfully', {
      token: newToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    next(error);
  }
};


// ================= EXPORTS =================
module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  refreshToken
};