// server/src/routes/commute.routes.js
// OWNER: Member 2

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

// router.get("/",                     authenticate, commuteController.list);
// router.get("/search",               authenticate, commuteController.search);
router.post("/",createCommuteValidator, validate, commuteController.create);
// router.get("/:id",                  authenticate, commuteIdParamValidator, validate, commuteController.getById);
// router.put("/:id",                  authenticate, updateCommuteValidator, validate, commuteController.update);
// router.delete("/:id",               authenticate, commuteIdParamValidator, validate, commuteController.cancel);
// router.get("/:id/requests",         authenticate, commuteIdParamValidator, validate, commuteController.listRequests);
// router.get("/:id/bookings",         authenticate, commuteIdParamValidator, validate, commuteController.listBookings);

// Passenger request seat on commute via /api/commutes/:id/bookings
// router.post("/:id/bookings",        authenticate, createBookingValidator, validate, bookingController.create);

module.exports = router;
