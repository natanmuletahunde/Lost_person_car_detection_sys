require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const expressSanitizer = require('express-sanitizer');
const swaggerUi = require('swagger-ui-express');

const connectDB = require('./config/database');
const config = require('./config');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const sanitizeRequest = require('./middlewares/mongoSanitize');
const { swaggerSpec, isSwaggerEnabled, isSwaggerAdminOnly } = require('./config/swagger');
const { protect, authorize } = require('./middlewares/auth');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const sightingRoutes = require('./routes/sighting.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const alertRoutes = require('./routes/alert.routes');
const uploadRoutes = require('./routes/upload.routes');
const searchRoutes = require('./routes/search.routes');
const detectionRoutes = require('./routes/detection.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

connectDB();

app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(sanitizeRequest);
app.use(expressSanitizer());

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check
 *     responses:
 *       200:
 *         description: API is up
 */
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

if (isSwaggerEnabled()) {
  const docsGuards = [];

  if (isSwaggerAdminOnly()) {
    docsGuards.push(protect, authorize('admin'));
  }

  app.use(
    '/api-docs',
    ...docsGuards,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );
  app.get('/api-docs.json', ...docsGuards, (req, res) => {
    res.json(swaggerSpec);
  });
}

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/sightings', sightingRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/detections', detectionRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = config.server.port;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running in ${config.server.nodeEnv} mode on http://${HOST}:${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
