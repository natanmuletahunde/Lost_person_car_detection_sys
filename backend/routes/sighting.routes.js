const express = require('express');
const router = express.Router();
const { reportSighting, getMySightings, getAllSightings, getSightingById, updateSighting, deleteSighting, getNearbySightings } = require('../controllers/sighting.controller');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { reportSightingValidation, updateSightingValidation } = require('../validations/sighting.validation');

/**
 * @swagger
 * /api/v1/sightings/nearby:
 *   get:
 *     tags:
 *       - Search
 *     summary: Get nearby sightings by coordinates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: radius
 *         schema: { type: integer, default: 10000 }
 *     responses:
 *       200:
 *         description: Nearby sightings returned
 *
 * /api/v1/sightings/my-sightings:
 *   get:
 *     tags:
 *       - Sightings
 *     summary: Get current user's sightings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, reviewed, confirmed, resolved] }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [person, vehicle] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Sightings returned
 *
 * /api/v1/sightings:
 *   post:
 *     tags:
 *       - Sightings
 *     summary: Report a lost person or vehicle sighting
 *     description: Set type=person for lost-person reports, type=vehicle for car detection reports.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, description, location]
 *             properties:
 *               type: { type: string, enum: [person, vehicle] }
 *               description: { type: string }
 *               location: { $ref: '#/components/schemas/GeoPoint' }
 *               images:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       201:
 *         description: Sighting reported
 *   get:
 *     tags:
 *       - Sightings
 *     summary: Admin or moderator listing for all sightings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, reviewed, confirmed, resolved] }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [person, vehicle] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Sightings returned
 *       403:
 *         description: Admin or moderator only
 *
 * /api/v1/sightings/{id}:
 *   get:
 *     tags:
 *       - Sightings
 *     summary: Get sighting by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Sighting returned
 *       404:
 *         description: Sighting not found
 *   patch:
 *     tags:
 *       - Admin Approvals
 *     summary: Update sighting status/description/notes
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
 *               status: { type: string, enum: [pending, reviewed, confirmed, resolved] }
 *               description: { type: string }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Sighting updated
 *       403:
 *         description: Admin or moderator only
 *   delete:
 *     tags:
 *       - Sightings
 *     summary: Delete sighting
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Sighting deleted
 *       403:
 *         description: Admin only
 */
router.get('/nearby', protect, getNearbySightings);

router.get('/my-sightings', protect, getMySightings);
router.post('/', protect, reportSightingValidation, validate, reportSighting);

router.get('/', protect, authorize('admin', 'moderator'), getAllSightings);
router.get('/:id', protect, getSightingById);
router.patch('/:id', protect, authorize('admin', 'moderator'), updateSightingValidation, validate, updateSighting);
router.delete('/:id', protect, authorize('admin'), deleteSighting);

module.exports = router;
