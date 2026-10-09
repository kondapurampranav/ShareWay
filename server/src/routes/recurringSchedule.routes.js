// server/src/routes/recurringSchedule.routes.js
// OWNER: Member 2

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const recurringController = require('../controllers/recurringSchedule.controller');

const router = Router();

router.get('/',                           authenticate, recurringController.list);
router.post('/',                          authenticate, recurringController.create);
router.get('/:id',                        authenticate, recurringController.getById);
router.delete('/:id',                     authenticate, recurringController.cancelSchedule);
router.delete('/:id/instances/:date',     authenticate, recurringController.cancelInstance);

module.exports = router;
