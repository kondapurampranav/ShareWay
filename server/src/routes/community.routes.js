// server/src/routes/community.routes.js
// OWNER: Member 1

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../config/constants');
const communityController = require('../controllers/community.controller');

const router = Router();

// Public: allows unauthenticated users to view community list during registration
router.get('/',                                  communityController.list);

// Authenticated routes
router.post('/:id/join',                         authenticate, communityController.join);
router.get('/:id/members',                       authenticate, communityController.listMembers);
router.patch('/memberships/:membershipId',        authenticate, authorize(ROLES.COMMUNITY_ADMIN, ROLES.PLATFORM_ADMIN), communityController.updateMembership);

module.exports = router;
