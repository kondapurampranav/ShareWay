// server/src/validators/rideRequest.validators.js
// OWNER: Member 3
// Uses express-validator chains for ride request creation, lookup, and cancellation.

const { body, param } = require("express-validator");
const { VEHICLE_TYPE } = require("../config/constants");

const createRideRequestValidator = [
  body("origin")
    .trim()
    .notEmpty()
    .withMessage("Origin is required"),
  body("destination")
    .trim()
    .notEmpty()
    .withMessage("Destination is required"),
  body("desiredDeparture")
    .notEmpty()
    .withMessage("Desired departure time is required")
    .isISO8601()
    .withMessage("Desired departure must be a valid ISO 8601 date string")
    .custom((val) => {
      if (new Date(val) <= new Date()) {
        throw new Error("Desired departure must be in the future");
      }
      return true;
    }),
  body("maxContribution")
    .notEmpty()
    .withMessage("Maximum contribution is required")
    .isFloat({ min: 0 })
    .withMessage("Maximum contribution must be a non-negative number")
    .toFloat(),
  body("vehiclePreference")
    .optional({ nullable: true })
    .isIn([VEHICLE_TYPE.BIKE, VEHICLE_TYPE.CAR])
    .withMessage("Vehicle preference must be BIKE or CAR"),
  body("notes")
    .optional({ nullable: true })
    .isString()
    .trim(),
];

const rideRequestIdParamValidator = [
  param("id")
    .isUUID()
    .withMessage("Invalid ride request ID format"),
];

module.exports = {
  createRideRequestValidator,
  rideRequestValidator: createRideRequestValidator,
  rideRequestIdParamValidator,
};
