// server/src/routes/commute.routes.js
// OWNER: Member 2

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { commuteValidator } = require('../validators/commute.validators');
const commuteController = require('../controllers/commute.controller');

const router = Router();

router.get('/',                     authenticate, commuteController.list);
router.post('/',                    authenticate, commuteValidator, validate, commuteController.create);
router.get('/:id',                  authenticate, commuteController.getById);
router.put('/:id',                  authenticate, commuteController.update);
router.delete('/:id',               authenticate, commuteController.cancel);
router.get('/:id/requests',         authenticate, commuteController.listRequests);   // incoming seat requests
router.get('/:id/bookings',         authenticate, commuteController.listBookings);

module.exports = router;
