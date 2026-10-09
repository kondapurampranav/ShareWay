// server/src/routes/notification.routes.js
// OWNER: Member 4

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const notificationController = require('../controllers/notification.controller');

const router = Router();

router.get('/',           authenticate, notificationController.list);
router.patch('/:id/read', authenticate, notificationController.markRead);
router.patch('/read-all', authenticate, notificationController.markAllRead);

module.exports = router;
