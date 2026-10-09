// server/src/routes/rideRequest.routes.js
// OWNER: Member 3

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { rideRequestValidator } = require('../validators/rideRequest.validators');
const rideRequestController = require('../controllers/rideRequest.controller');

const router = Router();

router.get('/',             authenticate, rideRequestController.list);
router.post('/',            authenticate, rideRequestValidator, validate, rideRequestController.create);
router.get('/:id',          authenticate, rideRequestController.getById);
router.delete('/:id',       authenticate, rideRequestController.cancel);
router.get('/:id/matches',  authenticate, rideRequestController.getMatches);

module.exports = router;
