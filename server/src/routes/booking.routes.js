const { Router } = require("express");
const authenticate = require("../middleware/authenticate");
const validate = require("../middleware/validate");
const {
  createBookingValidator,
  updateBookingStatusValidator,
  bookingIdParamValidator,
} = require("../validators/booking.validators");
const bookingController = require("../controllers/booking.controller");

const router = Router();

// Passenger requests a seat on a commute (nested or root)
router.post("/commutes/:commuteId/bookings", createBookingValidator, validate, bookingController.create);
router.get("/", bookingController.list);
router.get("/:id", bookingIdParamValidator, validate, bookingController.getById);
router.patch("/:id/status", updateBookingStatusValidator, validate, bookingController.updateStatus);
router.patch("/:id/complete", bookingIdParamValidator, validate, bookingController.complete);
router.delete("/:id", bookingIdParamValidator, validate, (req, res, next) => {
  req.body.status = "CANCELLED";
  bookingController.updateStatus(req, res, next);
});

module.exports = router;
