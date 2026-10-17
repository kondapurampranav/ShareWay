// server/src/controllers/auth.controller.js
// OWNER: Member 1
// Handles HTTP req/res — delegates all logic to auth.service.js

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const authService = require('../services/auth.service');

/**
 * Register a new user
 * POST /api/auth/register
 */
exports.register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  return ApiResponse.created(res, data, 'Registration successful');
});

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  return ApiResponse.ok(res, data, 'Login successful');
});

/**
 * Logout user
 * POST /api/auth/logout
 */
exports.logout = asyncHandler(async (_req, res) => {
  return ApiResponse.ok(res, null, 'Logged out successfully');
});
