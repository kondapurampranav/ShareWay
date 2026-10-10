// server/src/controllers/admin.controller.js
// OWNER: Member 1
// Handles HTTP req/res — delegates all logic to admin.service.js

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const adminService = require('../services/admin.service');

/**
 * Get administrative metrics and overview
 * GET /api/admin/stats
 */
exports.stats = asyncHandler(async (req, res) => {
  const data = await adminService.stats(req.user, req.query);
  return ApiResponse.ok(res, data);
});

/**
 * List members with status/search filtering
 * GET /api/admin/members
 */
exports.listMembers = asyncHandler(async (req, res) => {
  const data = await adminService.listMembers(req.user, req.query);
  return ApiResponse.ok(res, data);
});

/**
 * Update member status or user role
 * PATCH /api/admin/members/:id
 */
exports.updateMember = asyncHandler(async (req, res) => {
  const data = await adminService.updateMember(req.user, req.params.id, req.body);
  return ApiResponse.ok(res, data, 'Member status updated successfully');
});

/**
 * List user safety and misconduct reports
 * GET /api/admin/reports
 */
exports.listReports = asyncHandler(async (req, res) => {
  const data = await adminService.listReports(req.user, req.query);
  return ApiResponse.ok(res, data);
});

/**
 * Update report status and administrator notes
 * PATCH /api/admin/reports/:id
 */
exports.updateReport = asyncHandler(async (req, res) => {
  const data = await adminService.updateReport(req.user, req.params.id, req.body);
  return ApiResponse.ok(res, data, 'Report updated successfully');
});

/**
 * List all rides/commutes across the platform
 * GET /api/admin/commutes
 */
exports.listCommutes = asyncHandler(async (req, res) => {
  const data = await adminService.listCommutes(req.user, req.query);
  return ApiResponse.ok(res, data);
});
