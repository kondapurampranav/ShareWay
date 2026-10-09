// server/src/routes/booking.routes.js
// OWNER: Member 3

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { bookingValidator } = require('../validators/booking.validators');
const bookingController = require('../controllers/booking.controller');

const router = Router();

// Passenger requests a seat on a commute
router.post('/commutes/:commuteId/bookings',  authenticate, bookingValidator, validate, bookingController.create);

router.get('/',        authenticate, bookingController.list);
router.get('/:id',     authenticate, bookingController.getById);
router.patch('/:id/status',   authenticate, bookingController.updateStatus);   // accept / reject / cancel
router.patch('/:id/complete', authenticate, bookingController.complete);

module.exports = router;
