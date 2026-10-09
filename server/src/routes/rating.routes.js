// server/src/routes/rating.routes.js
// OWNER: Member 4

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { ratingValidator } = require('../validators/rating.validators');
const ratingController = require('../controllers/rating.controller');

const router = Router();

router.post('/',          authenticate, ratingValidator, validate, ratingController.create);
router.get('/users/:id',  authenticate, ratingController.getUserRatings);

module.exports = router;
