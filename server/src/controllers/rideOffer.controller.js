// server/src/controllers/rideOffer.controller.js
// OWNER: Member 3
// Handles HTTP req/res — delegates all logic to rideOffer.service.js

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const rideOfferService = require("../services/rideOffer.service");

/**
 * POST /api/ride-requests/:requestId/offers
 * or POST /api/ride-offers
 * Driver sends a ride offer.
 */
exports.create = asyncHandler(async (req, res) => {
  const rideRequestId = req.params.requestId || req.body.rideRequestId;
  const offer = await rideOfferService.createRideOffer(req.user.id, {
    ...req.body,
    rideRequestId,
  });
  return ApiResponse.created(res, offer, "Ride offer submitted successfully");
});

/**
 * GET /api/ride-offers
 * Driver retrieves their own offers.
 */
exports.list = asyncHandler(async (req, res) => {
  const offers = await rideOfferService.getDriverOffers(req.user.id, req.query);
  return ApiResponse.ok(res, offers, "Driver ride offers retrieved successfully");
});

/**
 * GET /api/ride-requests/:requestId/offers
 * Passenger views offers for their request.
 */
exports.listByRequest = asyncHandler(async (req, res) => {
  const offers = await rideOfferService.getOffersForRequest(req.params.requestId, req.user.id);
  return ApiResponse.ok(res, offers, "Ride request offers retrieved successfully");
});

/**
 * GET /api/ride-offers/:id
 * Retrieves a single ride offer by ID.
 */
exports.getById = asyncHandler(async (req, res) => {
  const offer = await rideOfferService.getRideOfferById(req.params.id, req.user.id);
  return ApiResponse.ok(res, offer, "Ride offer retrieved successfully");
});

/**
 * PATCH /api/ride-offers/:id
 * or PATCH /api/ride-offers/:id/status
 * Passenger accepts or rejects an offer.
 */
exports.respond = asyncHandler(async (req, res) => {
  const result = await rideOfferService.respondToOffer(
    req.params.id,
    req.user.id,
    req.body.status
  );
  return ApiResponse.ok(res, result, `Ride offer ${req.body.status.toLowerCase()} successfully`);
});

/**
 * DELETE /api/ride-offers/:id
 * Driver withdraws their pending ride offer.
 */
exports.withdraw = asyncHandler(async (req, res) => {
  const offer = await rideOfferService.withdrawOffer(req.params.id, req.user.id);
  return ApiResponse.ok(res, offer, "Ride offer withdrawn successfully");
});
