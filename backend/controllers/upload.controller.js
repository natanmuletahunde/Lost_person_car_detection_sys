const path = require('path');
const crypto = require('crypto');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @swagger
 * /api/v1/uploads/image:
 *   post:
 *     tags:
 *       - Image Upload
 *     summary: Upload a sighting image
 *     description: Accepts multipart/form-data and returns file metadata for later persistence.
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
 *         description: Uploaded
 *       400:
 *         description: Invalid upload payload
 *       401:
 *         description: Unauthorized
 */
const uploadSightingImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, 'Image file is required', 400);
    }

    const extension = path.extname(req.file.originalname || '').toLowerCase() || '.jpg';
    const mockFileName = `${crypto.randomUUID()}${extension}`;
    const mockUrl = `/uploads/mock/${mockFileName}`;

    return ApiResponse.success(
      res,
      'Image uploaded successfully',
      {
        file: {
          fieldName: req.file.fieldname,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          temporaryUrl: mockUrl,
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadSightingImage,
};
