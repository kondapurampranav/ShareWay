const { Router } = require("express");
const authenticate = require("../middleware/authenticate");
const validate = require("../middleware/validate");
const {
  createRideRequestValidator,
  rideRequestIdParamValidator,
} = require("../validators/rideRequest.validators");
const { createRideOfferValidator } = require("../validators/rideOffer.validators");
const rideRequestController = require("../controllers/rideRequest.controller");
const rideOfferController = require("../controllers/rideOffer.controller");

const router = Router();

router.get("/discover",             authenticate, rideRequestController.discover);
router.get("/",                     authenticate, rideRequestController.list);
router.post("/",                    authenticate, createRideRequestValidator, validate, rideRequestController.create);
router.get("/:id",                  authenticate, rideRequestIdParamValidator, validate, rideRequestController.getById);
router.delete("/:id",               authenticate, rideRequestIdParamValidator, validate, rideRequestController.cancel);
router.get("/:id/matches",          authenticate, rideRequestIdParamValidator, validate, rideRequestController.getMatches);

// Offers on ride requests
router.get("/:requestId/offers",    authenticate, rideOfferController.listByRequest);
router.post("/:requestId/offers",   authenticate, createRideOfferValidator, validate, rideOfferController.create);

module.exports = router;
