// server/src/services/community.service.js
// OWNER: Member 1
// Business logic for community listings, memberships, and verification.

const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { MEMBERSHIP_STATUS } = require('../config/constants');

/**
 * List all active communities (e.g., for selection during registration or search).
 */
exports.list = async () => {
  return prisma.community.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      domain: true,
      createdAt: true,
      _count: {
        select: {
          memberships: {
            where: { status: 'APPROVED' },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
};

/**
 * Join a community.
 */
exports.join = async (user, communityId) => {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
  });

  if (!community || !community.isActive) {
    throw ApiError.notFound('Community not found or inactive');
  }

  // Check existing membership
  const existing = await prisma.membership.findUnique({
    where: {
      userId_communityId: {
        userId: user.id,
        communityId,
      },
    },
  });

  if (existing) {
    throw ApiError.conflict(`Already requested or joined this community (Status: ${existing.status})`);
  }

  // Verify domain if specified
  let status = MEMBERSHIP_STATUS.PENDING;
  if (community.domain) {
    const cleanDomain = community.domain.startsWith('@')
      ? community.domain.slice(1).toLowerCase()
      : community.domain.toLowerCase();
    const userDomain = user.email.split('@')[1]?.toLowerCase();
    if (userDomain === cleanDomain) {
      status = MEMBERSHIP_STATUS.APPROVED;
    }
  }

  return prisma.membership.create({
    data: {
      userId: user.id,
      communityId,
      status,
      joinedAt: status === MEMBERSHIP_STATUS.APPROVED ? new Date() : null,
    },
    include: {
      community: true,
    },
  });
};

/**
 * List members of a community.
 */
exports.listMembers = async (communityId, { status } = {}) => {
  const where = { communityId };
  if (status) {
    where.status = status;
  }

  return prisma.membership.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          phone: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Update membership status (Approve, Reject, Suspend).
 */
exports.updateMembership = async (membershipId, { status }) => {
  if (!Object.values(MEMBERSHIP_STATUS).includes(status)) {
    throw ApiError.badRequest('Invalid membership status');
  }

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
  });

  if (!membership) {
    throw ApiError.notFound('Membership not found');
  }

  return prisma.membership.update({
    where: { id: membershipId },
    data: {
      status,
      joinedAt: status === MEMBERSHIP_STATUS.APPROVED ? new Date() : membership.joinedAt,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      community: true,
    },
  });
};
