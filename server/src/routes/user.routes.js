// server/src/routes/user.routes.js
// OWNER: Member 1

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const userController = require('../controllers/user.controller');

const router = Router();

router.get('/me',     authenticate, userController.getMe);
router.put('/me',     authenticate, userController.updateMe);
router.get('/:id',    authenticate, userController.getById);

module.exports = router;
