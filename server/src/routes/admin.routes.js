// server/src/routes/admin.routes.js
// OWNER: Member 4

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../config/constants');
const adminController = require('../controllers/admin.controller');

const isAdmin = [authenticate, authorize(ROLES.COMMUNITY_ADMIN, ROLES.PLATFORM_ADMIN)];

const router = Router();

router.get('/stats',                isAdmin, adminController.stats);
router.get('/members',              isAdmin, adminController.listMembers);
router.patch('/members/:id',        isAdmin, adminController.updateMember);
router.get('/reports',              isAdmin, adminController.listReports);
router.patch('/reports/:id',        isAdmin, adminController.updateReport);
router.get('/commutes',             isAdmin, adminController.listCommutes);

module.exports = router;
