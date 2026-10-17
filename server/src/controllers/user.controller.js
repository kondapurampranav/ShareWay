// server/src/controllers/user.controller.js
// OWNER: Member 1
// Handles HTTP req/res — delegates all logic to user.service.js

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const userService = require('../services/user.service');

/**
 * Get current user profile
 * GET /api/users/me
 */
exports.getMe = asyncHandler(async (req, res) => {
  const data = await userService.getMe(req.user.id);
  return ApiResponse.ok(res, data);
});

/**
 * Update current user profile
 * PUT /api/users/me
 */
exports.updateMe = asyncHandler(async (req, res) => {
  const data = await userService.updateMe(req.user.id, req.body);
  return ApiResponse.ok(res, data, 'Profile updated successfully');
});

/**
 * Get public profile by ID
 * GET /api/users/:id
 */
exports.getById = asyncHandler(async (req, res) => {
  const data = await userService.getById(req.params.id);
  return ApiResponse.ok(res, data);
});
