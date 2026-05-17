const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { approveSighting, rejectSighting } = require('../controllers/admin.controller');
const {
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
  verifyVehicleDocument
} = require('../controllers/adminExtended.controller');

/**
 * @swagger
 * /api/v1/admin/sightings/{id}/approve:
 *   patch:
 *     tags:
 *       - Admin Approvals
 *     summary: Approve a sighting report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sighting approved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Sighting not found
 *
 * /api/v1/admin/sightings/{id}/reject:
 *   patch:
 *     tags:
 *       - Admin Approvals
 *     summary: Reject a sighting report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Image quality is not enough for confirmation.
 *     responses:
 *       200:
 *         description: Sighting rejected
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Sighting not found
 */
router.patch('/sightings/:id/approve', protect, authorize('admin', 'moderator'), approveSighting);
router.patch('/sightings/:id/reject', protect, authorize('admin', 'moderator'), rejectSighting);

router.get('/dashboard', protect, authorize('admin', 'moderator'), getDashboardStats);
router.get('/users', protect, authorize('admin', 'moderator'), getAllUsers);
router.get('/users/:id', protect, authorize('admin', 'moderator'), getUserById);
router.patch('/users/:id', protect, authorize('admin', 'moderator'), updateUser);
router.delete('/users/:id', protect, authorize('admin', 'moderator'), deleteUser);

router.get('/cases', protect, authorize('admin', 'moderator'), getAllCases);
router.get('/cases/:type/:id', protect, authorize('admin', 'moderator'), getCaseDetail);
router.patch('/cases/:id/status', protect, authorize('admin', 'moderator'), updateCaseStatus);
router.delete('/cases/:type/:id', protect, authorize('admin', 'moderator'), deleteCase);

router.get('/vehicles/pending-validation', protect, authorize('admin', 'moderator'), getPendingVehicleValidations);
router.patch('/vehicles/:id/verify', protect, authorize('admin', 'moderator'), verifyVehicleDocument);

router.get('/finance', protect, authorize('admin', 'moderator'), getFinanceStats);

router.get('/feedback', protect, authorize('admin', 'moderator'), getAllFeedback);
router.patch('/feedback/:id/respond', protect, authorize('admin', 'moderator'), respondToFeedback);

router.post('/notifications/bulk', protect, authorize('admin', 'moderator'), sendBulkNotification);
router.get('/notifications/settings', protect, authorize('admin', 'moderator'), getNotificationsSettings);

module.exports = router;
