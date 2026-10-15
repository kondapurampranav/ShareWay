// server/src/controllers/rideRequest.controller.js
// OWNER: Member 3
// Handles HTTP req/res — delegates all logic to rideRequest.service.js

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const rideRequestService = require("../services/rideRequest.service");

/**
 * POST /api/ride-requests
 * Passenger publishes a new ride request.
 */
exports.create = asyncHandler(async (req, res) => {
  const rideRequest = await rideRequestService.createRideRequest(req.user.id, req.body);
  return ApiResponse.created(res, rideRequest, "Ride request published successfully");
});

/**
 * GET /api/ride-requests
 * Retrieves passenger's own ride requests, or community requests if discover query param is present.
 */
exports.list = asyncHandler(async (req, res) => {
  if (req.query.discover === "true") {
    const requests = await rideRequestService.discoverCommunityRideRequests(req.user.id, req.query);
    return ApiResponse.ok(res, requests, "Community ride requests discovered successfully");
  }

  const rideRequests = await rideRequestService.getPassengerRideRequests(req.user.id, req.query);
  return ApiResponse.ok(res, rideRequests, "Passenger ride requests retrieved successfully");
});

/**
 * GET /api/ride-requests/discover
 * Community members discover eligible ride requests within their community.
 */
exports.discover = asyncHandler(async (req, res) => {
  const requests = await rideRequestService.discoverCommunityRideRequests(req.user.id, req.query);
  return ApiResponse.ok(res, requests, "Community ride requests discovered successfully");
});

/**
 * GET /api/ride-requests/:id
 * Retrieves a single ride request by ID.
 */
exports.getById = asyncHandler(async (req, res) => {
  const rideRequest = await rideRequestService.getRideRequestById(req.params.id);
  return ApiResponse.ok(res, rideRequest, "Ride request retrieved successfully");
});

/**
 * DELETE /api/ride-requests/:id
 * Passenger cancels their own eligible ride request.
 */
exports.cancel = asyncHandler(async (req, res) => {
  const rideRequest = await rideRequestService.cancelRideRequest(req.params.id, req.user.id);
  return ApiResponse.ok(res, rideRequest, "Ride request cancelled successfully");
});

/**
 * GET /api/ride-requests/:id/matches
 * Returns compatible commutes for this ride request.
 */
exports.getMatches = asyncHandler(async (req, res) => {
  const rideRequest = await rideRequestService.getRideRequestById(req.params.id);
  // Matching logic can be extended via matching.service
  return ApiResponse.ok(res, { rideRequest, matches: [] }, "Matches retrieved successfully");
});
