// server/src/routes/contribution.routes.js
// OWNER: Member 3

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { contributionValidator } = require('../validators/contribution.validators');
const contributionController = require('../controllers/contribution.controller');

const router = Router();

router.post('/bookings/:bookingId/proposals',          authenticate, contributionValidator, validate, contributionController.propose);
router.patch('/bookings/:bookingId/proposals/:id',     authenticate, contributionController.respond);

module.exports = router;
