const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const commuteService = require("../services/commute.service");

// creates a commute.
exports.create = asyncHandler(async (req, res) => {
  const driverId = "test-driver-001";
  const commute = await commuteService.createCommute(driverId, req.body);
  return ApiResponse.created(res, commute, "Commute created successfully");
});

// lists all the commutes by the driver.
exports.list = asyncHandler(async (req, res) => {
  if (req.query.origin || req.query.destination || req.query.date || req.query.search) {
    const commutes = await commuteService.searchCommutes(req.query);
    return ApiResponse.ok(res, commutes, "Available commutes retrieved successfully");
  }
  const commutes = await commuteService.getDriverCommutes(req.user.id, req.query);
  return ApiResponse.ok(res, commutes, "Driver commutes retrieved successfully");
});

// Retrieves a single commute by ID.
exports.getById = asyncHandler(async (req, res) => {
  const commute = await commuteService.getCommuteById(req.params.id);
  return ApiResponse.ok(res, commute, "Commute retrieved successfully");
});

// Updates the driver's own commute.
exports.update = asyncHandler(async (req, res) => {
  const commute = await commuteService.updateCommute(req.params.id, req.user.id, req.body);
  return ApiResponse.ok(res, commute, "Commute updated successfully");
});

// Cancels the driver's own commute and active bookings.
exports.cancel = asyncHandler(async (req, res) => {
  const commute = await commuteService.cancelCommute(req.params.id, req.user.id);
  return ApiResponse.ok(res, commute, "Commute cancelled successfully");
});


// Lists incoming seat requests for a commute.
exports.listRequests = asyncHandler(async (req, res) => {
  const commute = await commuteService.getCommuteById(req.params.id);
  if (commute.driverId !== req.user.id) {
    throw ApiError.forbidden("You are not authorized to view requests for this commute");
  }
  const pendingRequests = (commute.bookings || []).filter((b) => b.status === "PENDING");
  return ApiResponse.ok(res, pendingRequests, "Seat requests retrieved successfully");
});


// Lists confirmed/active bookings for a commute.
exports.listBookings = asyncHandler(async (req, res) => {
  const commute = await commuteService.getCommuteById(req.params.id);
  if (commute.driverId !== req.user.id) {
    throw ApiError.forbidden("You are not authorized to view bookings for this commute");
  }
  return ApiResponse.ok(res, commute.bookings || [], "Commute bookings retrieved successfully");
});


// Searches available scheduled commutes for passengers.
exports.search = asyncHandler(async (req, res) => {
  const commutes = await commuteService.searchCommutes(req.query);
  return ApiResponse.ok(res, commutes, "Available commutes retrieved successfully");
});
