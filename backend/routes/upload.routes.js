const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { uploadImage } = require('../middlewares/upload');
const { uploadSightingImage } = require('../controllers/upload.controller');

/**
 * @swagger
 * /api/v1/uploads/image:
 *   post:
 *     tags:
 *       - Image Upload
 *     summary: Upload an image
 *     description: Accept a multipart image and return temporary file metadata.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               category:
 *                 type: string
 *                 example: sighting-evidence
 *     responses:
 *       201:
 *         description: Image uploaded
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 */
router.post('/image', protect, uploadImage.single('image'), uploadSightingImage);

module.exports = router;
