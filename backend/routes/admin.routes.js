const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { approveSighting, rejectSighting } = require('../controllers/admin.controller');

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

module.exports = router;
