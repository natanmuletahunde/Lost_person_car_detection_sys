require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const expressSanitizer = require('express-sanitizer');

const connectDB = require('./config/database');
const config = require('./config');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const sightingRoutes = require('./routes/sighting.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const alertRoutes = require('./routes/alert.routes');

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

app.use(mongoSanitize());
app.use(expressSanitizer());

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/sightings', sightingRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/alerts', alertRoutes);

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
