// server/src/routes/rideOffer.routes.js
// Driver offers to a passenger's ride request.
// OWNER: Member 3

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const rideOfferController = require('../controllers/rideOffer.controller');

const router = Router();

// POST /api/ride-requests/:requestId/offers  →  driver sends offer
// PATCH /api/ride-offers/:id                  →  passenger accept/reject
router.post('/ride-requests/:requestId/offers',  authenticate, rideOfferController.create);
router.patch('/:id',                             authenticate, rideOfferController.respond);
router.delete('/:id',                            authenticate, rideOfferController.withdraw);

module.exports = router;
