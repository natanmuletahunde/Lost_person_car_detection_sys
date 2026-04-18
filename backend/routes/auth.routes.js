const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, logout, refreshToken } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { registerValidation, loginValidation, updateProfileValidation, changePasswordValidation } = require('../validations/auth.validation');

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, phone, password, confirmPassword]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               password: { type: string, format: password }
 *               confirmPassword: { type: string, format: password }
 *     responses:
 *       201:
 *         description: User registered
 *
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login using email or phone
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [loginValue, password]
 *             properties:
 *               loginValue: { type: string, example: rahul@example.com }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Login successful
 *
 * /api/v1/auth/refresh-token:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Token refreshed
 *
 * /api/v1/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user returned
 *       401:
 *         description: Unauthorized
 *
 * /api/v1/auth/profile:
 *   patch:
 *     tags:
 *       - Authentication
 *     summary: Update logged-in user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *               profileImage: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 *
 * /api/v1/auth/change-password:
 *   patch:
 *     tags:
 *       - Authentication
 *     summary: Change password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword, confirmPassword]
 *             properties:
 *               currentPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password }
 *               confirmPassword: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Password changed
 *
 * /api/v1/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/refresh-token', refreshToken);

router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfileValidation, validate, updateProfile);
router.patch('/change-password', protect, changePasswordValidation, validate, changePassword);
router.post('/logout', protect, logout);

module.exports = router;
