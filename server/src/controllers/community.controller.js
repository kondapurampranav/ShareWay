// server/src/controllers/community.controller.js
// OWNER: Member 1
// Handles HTTP req/res — delegates all logic to community.service.js

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const communityService = require('../services/community.service');

/**
 * List active communities
 * GET /api/communities
 */
exports.list = asyncHandler(async (_req, res) => {
  const data = await communityService.list();
  return ApiResponse.ok(res, data);
});

/**
 * Join a community
 * POST /api/communities/:id/join
 */
exports.join = asyncHandler(async (req, res) => {
  const data = await communityService.join(req.user, req.params.id);
  return ApiResponse.created(res, data, 'Community joined or approval requested');
});

/**
 * List members of a community
 * GET /api/communities/:id/members
 */
exports.listMembers = asyncHandler(async (req, res) => {
  const data = await communityService.listMembers(req.params.id, req.query);
  return ApiResponse.ok(res, data);
});

/**
 * Update membership status
 * PATCH /api/communities/memberships/:membershipId
 */
exports.updateMembership = asyncHandler(async (req, res) => {
  const data = await communityService.updateMembership(req.params.membershipId, req.body);
  return ApiResponse.ok(res, data, 'Membership status updated successfully');
});
