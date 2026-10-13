const { Router } = require("express");
const authenticate = require("../middleware/authenticate");
const validate = require("../middleware/validate");
const {
  createCommuteValidator,
  updateCommuteValidator,
  commuteIdParamValidator,
} = require("../validators/commute.validators");
const { createBookingValidator } = require("../validators/booking.validators");
const commuteController = require("../controllers/commute.controller");
const bookingController = require("../controllers/booking.controller");

const router = Router();

// routes for passenger
router.get("/search", commuteController.search);

// Passenger request seat on commute
router.post("/:id/bookings", createBookingValidator, validate, bookingController.create);

// routes for driver
router.get("/", commuteController.list);
router.post("/",createCommuteValidator, validate, commuteController.create);
router.get("/:id", commuteIdParamValidator, validate, commuteController.getById);
router.put("/:id", updateCommuteValidator, validate, commuteController.update);
router.delete("/:id", commuteIdParamValidator, validate, commuteController.cancel);
router.get("/:id/requests", commuteIdParamValidator, validate, commuteController.listRequests);
router.get("/:id/bookings", commuteIdParamValidator, validate, commuteController.listBookings);

module.exports = router;
