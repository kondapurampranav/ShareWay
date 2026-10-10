// server/src/validators/commute.validators.js
// OWNER: Member 2
// Express-validator chains for commute creation, updates, and ID params.

const { body, param } = require("express-validator");
const { VEHICLE_TYPE } = require("../config/constants");

const createCommuteValidator = [
  body("origin")
    .trim()
    .notEmpty()
    .withMessage("Origin is required"),
  body("destination")
    .trim()
    .notEmpty()
    .withMessage("Destination is required"),
  body("departureTime")
    .notEmpty()
    .withMessage("Departure time is required")
    .isISO8601()
    .withMessage("Departure time must be a valid ISO 8601 date string")
    .custom((val) => {
      if (new Date(val) <= new Date()) {
        throw new Error("Departure time must be in the future");
      }
      return true;
    }),
  body("vehicleType")
    .notEmpty()
    .withMessage("Vehicle type is required")
    .isIn([VEHICLE_TYPE.BIKE, VEHICLE_TYPE.CAR])
    .withMessage("Vehicle type must be either BIKE or CAR"),
  body("totalSeats")
    .notEmpty()
    .withMessage("Total seats is required")
    .isInt({ min: 1, max: 10 })
    .withMessage("Total seats must be an integer between 1 and 10")
    .toInt(),
  body("contributionPerSeat")
    .notEmpty()
    .withMessage("Contribution per seat is required")
    .isFloat({ min: 0 })
    .withMessage("Contribution per seat must be a non-negative number")
    .toFloat(),
  body("notes")
    .optional()
    .isString()
    .trim(),
];

const updateCommuteValidator = [
  param("id")
    .isUUID()
    .withMessage("Invalid commute ID format"),
  body("origin")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Origin cannot be empty"),
  body("destination")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Destination cannot be empty"),
  body("departureTime")
    .optional()
    .isISO8601()
    .withMessage("Departure time must be a valid ISO 8601 date string")
    .custom((val) => {
      if (new Date(val) <= new Date()) {
        throw new Error("Departure time must be in the future");
      }
      return true;
    }),
  body("vehicleType")
    .optional()
    .isIn([VEHICLE_TYPE.BIKE, VEHICLE_TYPE.CAR])
    .withMessage("Vehicle type must be either BIKE or CAR"),
  body("totalSeats")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Total seats must be an integer between 1 and 10")
    .toInt(),
  body("contributionPerSeat")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Contribution per seat must be a non-negative number")
    .toFloat(),
  body("notes")
    .optional()
    .isString()
    .trim(),
];

const commuteIdParamValidator = [
  param("id")
    .isUUID()
    .withMessage("Invalid commute ID format"),
];

module.exports = {
  createCommuteValidator,
  commuteValidator: createCommuteValidator,
  updateCommuteValidator,
  commuteIdParamValidator,
};
