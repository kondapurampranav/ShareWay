// server/src/validators/auth.validators.js
// OWNER: Member 1
// Uses express-validator chains. Import in the route file before the validate middleware.

const { body } = require('express-validator');

exports.registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),

  body('communityId')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('Community ID must be a valid identifier'),
];

exports.loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];
