// server/src/routes/rideOffer.routes.js
// Driver offers to a passenger's ride request.
// OWNER: Member 3

const { Router } = require("express");
const authenticate = require("../middleware/authenticate");
const validate = require("../middleware/validate");
const {
  createRideOfferValidator,
  respondRideOfferValidator,
  rideOfferIdParamValidator,
} = require("../validators/rideOffer.validators");
const rideOfferController = require("../controllers/rideOffer.controller");

const router = Router();

// driver offers for the request of a passenger.
router.post("/ride-requests/:requestId/offers", createRideOfferValidator, validate, rideOfferController.create);
router.post("/", createRideOfferValidator, validate, rideOfferController.create);
router.get("/", rideOfferController.list);
router.get("/:id", rideOfferIdParamValidator, validate, rideOfferController.getById);
router.patch("/:id", respondRideOfferValidator, validate, rideOfferController.respond);
router.patch("/:id/status", respondRideOfferValidator, validate, rideOfferController.respond);
router.delete("/:id", rideOfferIdParamValidator, validate, rideOfferController.withdraw);

module.exports = router;
