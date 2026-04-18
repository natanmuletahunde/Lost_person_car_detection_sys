const express = require('express');
const router = express.Router();
const { createAlert, getMyAlerts, getAllAlerts, markAsRead, markAllAsRead, dismissAlert, deleteAlert } = require('../controllers/alert.controller');
const { protect, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * /api/v1/alerts/my-alerts:
 *   get:
 *     tags:
 *       - Alerts
 *     summary: Get current user's alerts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, dismissed, responded] }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [person, vehicle] }
 *       - in: query
 *         name: isRead
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Alerts returned
 *
 * /api/v1/alerts:
 *   post:
 *     tags:
 *       - Alerts
 *     summary: Create an alert
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, message]
 *             properties:
 *               type: { type: string, enum: [person, vehicle] }
 *               message: { type: string }
 *               location: { $ref: '#/components/schemas/GeoPoint' }
 *               expiresAt: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Alert created
 *   get:
 *     tags:
 *       - Alerts
 *     summary: Get all alerts (admin/moderator)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alerts returned
 *
 * /api/v1/alerts/mark-all-read:
 *   patch:
 *     tags:
 *       - Alerts
 *     summary: Mark all current user's alerts as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alerts marked as read
 *
 * /api/v1/alerts/{id}/read:
 *   patch:
 *     tags:
 *       - Alerts
 *     summary: Mark one alert as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Alert marked as read
 *
 * /api/v1/alerts/{id}/dismiss:
 *   patch:
 *     tags:
 *       - Alerts
 *     summary: Dismiss one alert
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Alert dismissed
 *
 * /api/v1/alerts/{id}:
 *   delete:
 *     tags:
 *       - Alerts
 *     summary: Delete an alert
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Alert deleted
 */
router.get('/my-alerts', protect, getMyAlerts);
router.post('/', protect, createAlert);
router.patch('/mark-all-read', protect, markAllAsRead);

router.get('/', protect, authorize('admin', 'moderator'), getAllAlerts);
router.patch('/:id/read', protect, markAsRead);
router.patch('/:id/dismiss', protect, dismissAlert);
router.delete('/:id', protect, deleteAlert);

module.exports = router;
