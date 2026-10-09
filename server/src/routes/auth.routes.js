// server/src/routes/auth.routes.js
// OWNER: Member 1

const { Router } = require('express');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { registerValidator, loginValidator } = require('../validators/auth.validators');
const authController = require('../controllers/auth.controller');

const router = Router();

router.post('/register', authLimiter, registerValidator, validate, authController.register);
router.post('/login',    authLimiter, loginValidator,    validate, authController.login);
router.post('/logout',   authController.logout);

module.exports = router;
