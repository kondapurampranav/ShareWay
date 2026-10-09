// server/src/middleware/authorize.js
// Role-based authorization middleware factory.
// OWNER: Member 1

const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/constants');

/**
 * Usage: authorize(ROLES.COMMUNITY_ADMIN, ROLES.PLATFORM_ADMIN)
 * Allows any of the specified roles to pass.
 */
const authorize = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
};

/**
 * Checks that the authenticated user has an APPROVED membership in
 * the target community. Attach communityId to req or pass via params.
 * Implement fully once Community module is built.
 */
const requireCommunityMember = (req, _res, next) => {
  // TODO: Member 1 — verify req.user has approved membership
  next();
};

module.exports = { authorize, requireCommunityMember };
