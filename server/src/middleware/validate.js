// server/src/middleware/validate.js
// Express-validator result checker middleware.
// OWNER: Member 1 — SHARED

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw ApiError.badRequest('Validation failed', errors.array());
  }
  next();
};

module.exports = validate;
