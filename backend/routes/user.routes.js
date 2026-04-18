const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser, getDashboardStats } = require('../controllers/user.controller');
const { protect, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * /api/v1/users/stats:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get admin dashboard stats
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats returned
 *       403:
 *         description: Admin only
 *
 * /api/v1/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users with filters and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [user, admin, moderator] }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Users returned
 *
 * /api/v1/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User returned
 *       404:
 *         description: User not found
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update user by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
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
 *               role: { type: string, enum: [user, admin, moderator] }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: User updated
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete user by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 */
router.get('/stats', protect, authorize('admin'), getDashboardStats);

router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.patch('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
