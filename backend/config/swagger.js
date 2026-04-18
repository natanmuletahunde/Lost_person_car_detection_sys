const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

const nodeEnv = process.env.NODE_ENV || 'development';
const port = process.env.PORT || 5000;
const serverUrl = process.env.SERVER_URL || `http://localhost:${port}`;

const swaggerOptions = {
  failOnErrors: true,
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Lost Person Car Detection API',
      version: '1.0.0',
      description: 'Backend API documentation for authentication, sightings, alerts, feedback, search, uploads, and admin approval workflows.',
    },
    servers: [
      {
        url: serverUrl,
        description: nodeEnv === 'production' ? 'Production server' : 'Local development server',
      },
    ],
    tags: [
      { name: 'Health', description: 'Service health and uptime routes' },
      { name: 'Authentication', description: 'Registration, login, token lifecycle, and profile routes' },
      { name: 'Users', description: 'Admin user management routes' },
      { name: 'Sightings', description: 'Lost person and vehicle sighting reports' },
      { name: 'Car Detection', description: 'Vehicle-specific detection/reporting routes' },
      { name: 'Image Upload', description: 'Multipart image upload routes' },
      { name: 'Search', description: 'Cross-entity search and geospatial lookups' },
      { name: 'Feedback', description: 'Feedback collection and moderation routes' },
      { name: 'Alerts', description: 'Alert creation and notification management routes' },
      { name: 'Admin Approvals', description: 'Admin/moderator approval decisions for sightings' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste JWT access token as: Bearer <token>',
        },
      },
      schemas: {
        ApiSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' },
            data: { type: 'object', nullable: true },
            meta: { type: 'object', nullable: true },
          },
        },
        ApiError: {
          type: 'object',
          required: ['success', 'message'],
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors: {
              type: 'array',
              items: { type: 'string' },
              nullable: true,
            },
          },
        },
        GeoPoint: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'Point' },
            coordinates: {
              type: 'array',
              minItems: 2,
              maxItems: 2,
              items: { type: 'number' },
              example: [77.5946, 12.9716],
            },
            address: { type: 'string', example: 'MG Road, Bengaluru' },
          },
          required: ['coordinates'],
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6617b4f0c9a8f227f4e81234' },
            firstName: { type: 'string', example: 'Rahul' },
            lastName: { type: 'string', example: 'Sharma' },
            email: { type: 'string', format: 'email', example: 'rahul@example.com' },
            phone: { type: 'string', example: '+91 9876543210' },
            role: { type: 'string', enum: ['user', 'admin', 'moderator'], example: 'user' },
            isActive: { type: 'boolean', example: true },
            address: { type: 'string', nullable: true },
            profileImage: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthPayload: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            token: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        Sighting: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: {
              oneOf: [
                { type: 'string' },
                { $ref: '#/components/schemas/User' },
              ],
            },
            type: { type: 'string', enum: ['person', 'vehicle'], example: 'person' },
            description: { type: 'string' },
            location: { $ref: '#/components/schemas/GeoPoint' },
            images: {
              type: 'array',
              items: { type: 'string' },
            },
            status: { type: 'string', enum: ['pending', 'reviewed', 'confirmed', 'resolved'], example: 'pending' },
            confirmedBy: { type: 'string', nullable: true },
            confirmedAt: { type: 'string', format: 'date-time', nullable: true },
            reportedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Feedback: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: {
              oneOf: [
                { type: 'string' },
                { $ref: '#/components/schemas/User' },
              ],
            },
            type: { type: 'string', enum: ['bug', 'feature', 'general', 'complaint'] },
            subject: { type: 'string' },
            message: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'reviewed', 'resolved', 'closed'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            response: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                respondedBy: { type: 'string' },
                respondedAt: { type: 'string', format: 'date-time' },
              },
              nullable: true,
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Alert: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: {
              oneOf: [
                { type: 'string' },
                { $ref: '#/components/schemas/User' },
              ],
            },
            type: { type: 'string', enum: ['person', 'vehicle'] },
            message: { type: 'string' },
            location: { $ref: '#/components/schemas/GeoPoint' },
            status: { type: 'string', enum: ['active', 'dismissed', 'responded'] },
            isRead: { type: 'boolean' },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 57 },
            pages: { type: 'integer', example: 6 },
          },
        },
      },
    },
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js'),
  ],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

const isSwaggerEnabled = () => {
  if (nodeEnv !== 'production') return true;
  return process.env.SWAGGER_ENABLED === 'true';
};

const isSwaggerAdminOnly = () => process.env.SWAGGER_ADMIN_ONLY === 'true';

module.exports = {
  swaggerSpec,
  isSwaggerEnabled,
  isSwaggerAdminOnly,
};
