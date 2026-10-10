// server/src/controllers/commute.controller.js
// OWNER: Member 2
// Handles HTTP req/res — delegates all business logic to commute.service.js

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const commuteService = require("../services/commute.service");

/**
 * POST /api/commutes
 * Creates a commute for the authenticated driver.
 */
exports.create = asyncHandler(async (req, res) => {
  const commute = await commuteService.createCommute(req.user.id, req.body);
  return ApiResponse.created(res, commute, "Commute created successfully");
});

/**
 * GET /api/commutes
 * Retrieves all commutes created by the authenticated driver.
 */
exports.list = asyncHandler(async (req, res) => {
  const commutes = await commuteService.getDriverCommutes(req.user.id, req.query);
  return ApiResponse.ok(res, commutes, "Driver commutes retrieved successfully");
});

/**
 * GET /api/commutes/:id
 * Retrieves a single commute by ID.
 */
exports.getById = asyncHandler(async (req, res) => {
  const commute = await commuteService.getCommuteById(req.params.id);
  return ApiResponse.ok(res, commute, "Commute retrieved successfully");
});

/**
 * PUT /api/commutes/:id
 * Updates the driver's own commute.
 */
exports.update = asyncHandler(async (req, res) => {
  const commute = await commuteService.updateCommute(req.params.id, req.user.id, req.body);
  return ApiResponse.ok(res, commute, "Commute updated successfully");
});

/**
 * DELETE /api/commutes/:id
 * Cancels the driver's own commute and active bookings.
 */
exports.cancel = asyncHandler(async (req, res) => {
  const commute = await commuteService.cancelCommute(req.params.id, req.user.id);
  return ApiResponse.ok(res, commute, "Commute cancelled successfully");
});

/**
 * GET /api/commutes/:id/requests
 * Lists incoming seat requests for a commute.
 */
exports.listRequests = asyncHandler(async (req, res) => {
  const commute = await commuteService.getCommuteById(req.params.id);
  if (commute.driverId !== req.user.id) {
    throw ApiError.forbidden("You are not authorized to view requests for this commute");
  }
  const pendingRequests = (commute.bookings || []).filter((b) => b.status === "PENDING");
  return ApiResponse.ok(res, pendingRequests, "Seat requests retrieved successfully");
});

/**
 * GET /api/commutes/:id/bookings
 * Lists confirmed/active bookings for a commute.
 */
exports.listBookings = asyncHandler(async (req, res) => {
  const commute = await commuteService.getCommuteById(req.params.id);
  if (commute.driverId !== req.user.id) {
    throw ApiError.forbidden("You are not authorized to view bookings for this commute");
  }
  return ApiResponse.ok(res, commute.bookings || [], "Commute bookings retrieved successfully");
});
