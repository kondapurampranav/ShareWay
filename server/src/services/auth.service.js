// server/src/services/auth.service.js
// OWNER: Member 1
// Business logic for user registration, authentication, and token issuance.

const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { hashPassword, comparePassword } = require('../utils/passwordHash');
const { signToken } = require('../utils/jwt');
const { ROLES, MEMBERSHIP_STATUS } = require('../config/constants');

/**
 * Remove sensitive fields from user object before returning to client.
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

/**
 * Validates whether an email matches a community domain constraint.
 * E.g., community domain might be '@dsce.edu.in' or 'dsce.edu.in'.
 */
const matchesCommunityDomain = (email, domain) => {
  if (!domain) return true;
  const cleanDomain = domain.startsWith('@') ? domain.slice(1).toLowerCase() : domain.toLowerCase();
  const emailDomain = email.split('@')[1]?.toLowerCase();
  return emailDomain === cleanDomain;
};

/**
 * Register a new user with optional community membership.
 */
exports.register = async ({ name, email, password, phone, communityId }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists');
  }

  // 2. Validate community if provided
  let community = null;
  let membershipStatus = MEMBERSHIP_STATUS.PENDING;

  if (communityId) {
    community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community || !community.isActive) {
      throw ApiError.badRequest('The selected community does not exist or is inactive');
    }

    // Community domain verification
    if (community.domain) {
      const isDomainMatch = matchesCommunityDomain(normalizedEmail, community.domain);
      if (!isDomainMatch) {
        throw ApiError.badRequest(
          `Email address must belong to the community domain: ${community.domain}`
        );
      }
      // If institutional email matches domain, auto-approve membership
      membershipStatus = MEMBERSHIP_STATUS.APPROVED;
    }
  }

  // 3. Hash password
  const passwordHash = await hashPassword(password);

  // 4. Create user and membership
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone ? phone.trim() : null,
      role: ROLES.MEMBER,
      ...(communityId && {
        memberships: {
          create: {
            communityId,
            status: membershipStatus,
            joinedAt: membershipStatus === MEMBERSHIP_STATUS.APPROVED ? new Date() : null,
          },
        },
      }),
    },
    include: {
      memberships: {
        include: {
          community: true,
        },
      },
    },
  });

  // 5. Generate JWT token
  const primaryMembership = user.memberships?.[0];
  const token = signToken({
    userId: user.id,
    role: user.role,
    communityId: primaryMembership?.communityId || null,
  });

  return {
    user: sanitizeUser(user),
    token,
  };
};

/**
 * Authenticate existing user and issue JWT token.
 */
exports.login = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Fetch user by email
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      memberships: {
        include: {
          community: true,
        },
      },
    },
  });

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // 2. Check if account is active
  if (!user.isActive) {
    throw ApiError.unauthorized('Your account has been deactivated. Please contact support.');
  }

  // 3. Verify password
  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // 4. Determine primary community
  const approvedMembership = user.memberships?.find(
    (m) => m.status === MEMBERSHIP_STATUS.APPROVED
  );
  const activeCommunityId = approvedMembership?.communityId || user.memberships?.[0]?.communityId || null;

  // 5. Issue JWT
  const token = signToken({
    userId: user.id,
    role: user.role,
    communityId: activeCommunityId,
  });

  return {
    user: sanitizeUser(user),
    token,
  };
};

exports.sanitizeUser = sanitizeUser;
