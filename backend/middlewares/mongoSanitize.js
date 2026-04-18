const mongoSanitize = require('express-mongo-sanitize');

/**
 * Express 5 compatibility middleware.
 * express-mongo-sanitize's built-in middleware reassigns req.query,
 * but req.query is getter-only in Express 5.
 */
const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    mongoSanitize.sanitize(req.body);
  }

  if (req.params && typeof req.params === 'object') {
    mongoSanitize.sanitize(req.params);
  }

  if (req.query && typeof req.query === 'object') {
    mongoSanitize.sanitize(req.query);
  }

  next();
};

module.exports = sanitizeRequest;
