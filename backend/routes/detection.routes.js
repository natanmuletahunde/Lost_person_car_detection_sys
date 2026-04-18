const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { createVehicleDetection, getVehicleDetections } = require('../controllers/detection.controller');

/**
 * @swagger
 * /api/v1/detections/vehicles:
 *   post:
 *     tags:
 *       - Car Detection
 *     summary: Create a vehicle detection report
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [description, location]
 *             properties:
 *               description:
 *                 type: string
 *                 example: White sedan seen near the bus stop.
 *               location:
 *                 $ref: '#/components/schemas/GeoPoint'
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Vehicle detection created
 *       401:
 *         description: Unauthorized
 *   get:
 *     tags:
 *       - Car Detection
 *     summary: List vehicle detections
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, confirmed, resolved]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vehicle detections retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/vehicles', protect, createVehicleDetection);
router.get('/vehicles', protect, authorize('admin', 'moderator'), getVehicleDetections);

module.exports = router;
