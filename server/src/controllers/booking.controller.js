const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const bookingService = require("../services/booking.service");

// Passenger requests seats on a commute.
exports.create = asyncHandler(async (req, res) => {
  const commuteId = req.params.commuteId || req.params.id || req.body.commuteId;
  const booking = await bookingService.createBooking(req.user.id, {
    ...req.body,
    commuteId,
  });
  return ApiResponse.created(res, booking, "Seat requested successfully");
});

// Retrieves list of bookings for the authenticated user.
exports.list = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getUserBookings(req.user.id, req.query);
  return ApiResponse.ok(res, bookings, "Bookings retrieved successfully");
});

// Retrieves a single booking by ID.
exports.getById = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user.id);
  return ApiResponse.ok(res, booking, "Booking retrieved successfully");
});

// Updates booking status (accept, reject, cancel).
exports.updateStatus = asyncHandler(async (req, res) => {
  const booking = await bookingService.updateBookingStatus(
    req.params.id,
    req.user.id,
    req.body.status
  );
  return ApiResponse.ok(res, booking, `Booking status updated to ${req.body.status}`);
});

// Marks an accepted booking as completed.
exports.complete = asyncHandler(async (req, res) => {
  const booking = await bookingService.completeBooking(req.params.id, req.user.id);
  return ApiResponse.ok(res, booking, "Booking completed successfully");
});
