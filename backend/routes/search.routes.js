const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { searchSightings } = require('../controllers/search.controller');

/**
 * @swagger
 * /api/v1/search/sightings:
 *   get:
 *     tags:
 *       - Search
 *     summary: Search sightings by keyword and filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search text for description or address
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [person, vehicle]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, confirmed, resolved]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Search results retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/sightings', protect, searchSightings);

module.exports = router;
