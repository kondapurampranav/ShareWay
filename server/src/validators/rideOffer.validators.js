// server/src/validators/rideOffer.validators.js
// OWNER: Member 3
// Uses express-validator chains for ride offer creation, responses, and lookups.

const { body, param } = require("express-validator");
const { RIDE_OFFER_STATUS } = require("../config/constants");

const createRideOfferValidator = [
  param("requestId")
    .optional()
    .isUUID()
    .withMessage("requestId in param must be a valid UUID"),
  body("rideRequestId")
    .optional()
    .isUUID()
    .withMessage("rideRequestId must be a valid UUID"),
  body().custom((_, { req }) => {
    const requestId = req.params.requestId || req.body.rideRequestId;
    if (!requestId) {
      throw new Error("rideRequestId is required in param or body");
    }
    return true;
  }),
  body("proposedContrib")
    .notEmpty()
    .withMessage("proposedContrib is required")
    .isFloat({ min: 0 })
    .withMessage("proposedContrib must be a non-negative number")
    .toFloat(),
  body("commuteId")
    .optional({ nullable: true })
    .isUUID()
    .withMessage("commuteId must be a valid UUID"),
  body("message")
    .optional({ nullable: true })
    .isString()
    .trim(),
];

const respondRideOfferValidator = [
  param("id")
    .isUUID()
    .withMessage("Invalid ride offer ID format"),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn([RIDE_OFFER_STATUS.ACCEPTED, RIDE_OFFER_STATUS.REJECTED])
    .withMessage("Status must be ACCEPTED or REJECTED"),
];

const rideOfferIdParamValidator = [
  param("id")
    .isUUID()
    .withMessage("Invalid ride offer ID format"),
];

module.exports = {
  createRideOfferValidator,
  rideOfferValidator: createRideOfferValidator,
  respondRideOfferValidator,
  rideOfferIdParamValidator,
};
