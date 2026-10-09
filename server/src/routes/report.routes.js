// server/src/routes/report.routes.js
// OWNER: Member 4

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { reportValidator } = require('../validators/report.validators');
const reportController = require('../controllers/report.controller');

const router = Router();

router.post('/', authenticate, reportValidator, validate, reportController.submit);
router.get('/mine', authenticate, reportController.myReports);

module.exports = router;
