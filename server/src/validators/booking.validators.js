// server/src/validators/booking.validators.js
// OWNER: Member 3
// Uses express-validator chains for booking creation, status updates, and param validation.

const { body, param } = require("express-validator");
const { BOOKING_STATUS } = require("../config/constants");

const createBookingValidator = [
  // commuteId can come from params (:id or :commuteId) or request body
  body("commuteId")
    .optional()
    .isUUID()
    .withMessage("commuteId must be a valid UUID"),
  param("commuteId")
    .optional()
    .isUUID()
    .withMessage("commuteId in param must be a valid UUID"),
  param("id")
    .optional()
    .isUUID()
    .withMessage("commute id in param must be a valid UUID"),
  body().custom((_, { req }) => {
    const commuteId = req.params.commuteId || req.params.id || req.body.commuteId;
    if (!commuteId) {
      throw new Error("commuteId is required in param or body");
    }
    return true;
  }),
  body("seatsBooked")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("seatsBooked must be an integer between 1 and 10")
    .toInt(),
  body("agreedContribution")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("agreedContribution must be a non-negative number")
    .toFloat(),
];

const updateBookingStatusValidator = [
  param("id")
    .isUUID()
    .withMessage("Invalid booking ID format"),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn([BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED])
    .withMessage("Status must be ACCEPTED, REJECTED, or CANCELLED"),
];

const bookingIdParamValidator = [
  param("id")
    .isUUID()
    .withMessage("Invalid booking ID format"),
];

module.exports = {
  createBookingValidator,
  bookingValidator: createBookingValidator,
  updateBookingStatusValidator,
  bookingIdParamValidator,
};
