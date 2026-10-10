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
const commuteController = require("../controllers/commute.controller");

const router = Router();

router.get("/",                     authenticate, commuteController.list);
router.post("/",                    authenticate, createCommuteValidator, validate, commuteController.create);
router.get("/:id",                  authenticate, commuteIdParamValidator, validate, commuteController.getById);
router.put("/:id",                  authenticate, updateCommuteValidator, validate, commuteController.update);
router.delete("/:id",               authenticate, commuteIdParamValidator, validate, commuteController.cancel);
router.get("/:id/requests",         authenticate, commuteIdParamValidator, validate, commuteController.listRequests);
router.get("/:id/bookings",         authenticate, commuteIdParamValidator, validate, commuteController.listBookings);

module.exports = router;
