const express = require('express');
const router = express.Router();
const { createFeedback, getMyFeedback, getAllFeedback, getFeedbackById, respondToFeedback, updateFeedbackStatus, deleteFeedback } = require('../controllers/feedback.controller');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createFeedbackValidation } = require('../validations/feedback.validation');

/**
 * @swagger
 * /api/v1/feedback/my-feedback:
 *   get:
 *     tags:
 *       - Feedback
 *     summary: Get current user's feedback submissions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, reviewed, resolved, closed] }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [bug, feature, general, complaint] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Feedback list returned
 *
 * /api/v1/feedback:
 *   post:
 *     tags:
 *       - Feedback
 *     summary: Submit feedback
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, subject, message]
 *             properties:
 *               type: { type: string, enum: [bug, feature, general, complaint] }
 *               subject: { type: string }
 *               message: { type: string }
 *               priority: { type: string, enum: [low, medium, high, urgent] }
 *     responses:
 *       201:
 *         description: Feedback submitted
 *   get:
 *     tags:
 *       - Feedback
 *     summary: Get all feedback (admin/moderator)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, reviewed, resolved, closed] }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [bug, feature, general, complaint] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high, urgent] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Feedback list returned
 *
 * /api/v1/feedback/{id}:
 *   get:
 *     tags:
 *       - Feedback
 *     summary: Get feedback by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Feedback returned
 *   delete:
 *     tags:
 *       - Feedback
 *     summary: Delete feedback by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Feedback deleted
 *
 * /api/v1/feedback/{id}/respond:
 *   patch:
 *     tags:
 *       - Feedback
 *     summary: Respond to feedback (admin/moderator)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text: { type: string }
 *     responses:
 *       200:
 *         description: Feedback responded
 *
 * /api/v1/feedback/{id}/status:
 *   patch:
 *     tags:
 *       - Feedback
 *     summary: Update feedback status/priority (admin/moderator)
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
 *               status: { type: string, enum: [pending, reviewed, resolved, closed] }
 *               priority: { type: string, enum: [low, medium, high, urgent] }
 *     responses:
 *       200:
 *         description: Feedback updated
 */
router.get('/my-feedback', protect, getMyFeedback);
router.post('/', protect, createFeedbackValidation, validate, createFeedback);

router.get('/', protect, authorize('admin', 'moderator'), getAllFeedback);
router.get('/:id', protect, getFeedbackById);
router.patch('/:id/respond', protect, authorize('admin', 'moderator'), respondToFeedback);
router.patch('/:id/status', protect, authorize('admin', 'moderator'), updateFeedbackStatus);
router.delete('/:id', protect, authorize('admin'), deleteFeedback);

module.exports = router;
