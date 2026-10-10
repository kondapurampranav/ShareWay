// server/src/services/admin.service.js
// OWNER: Member 1
// Business logic for Admin Dashboard, member approvals, reports, and commute oversight.

const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { ROLES, MEMBERSHIP_STATUS, REPORT_STATUS } = require('../config/constants');

/**
 * Helper to determine community scope for community admin vs platform admin.
 */
const getAdminCommunityId = async (adminUser, queryCommunityId) => {
  if (adminUser.role === ROLES.PLATFORM_ADMIN) {
    return queryCommunityId || null;
  }
  const membership = await prisma.membership.findFirst({
    where: { userId: adminUser.id, status: MEMBERSHIP_STATUS.APPROVED },
  });
  return membership?.communityId || null;
};

/**
 * Get dashboard overview statistics.
 */
exports.stats = async (adminUser, query = {}) => {
  const communityId = await getAdminCommunityId(adminUser, query.communityId);
  const membershipWhere = communityId ? { communityId } : {};

  // Aggregate membership numbers
  const [
    totalMembers,
    pendingMembers,
    approvedMembers,
    suspendedMembers,
    totalCommutes,
    activeCommutes,
    totalBookings,
    openReports,
    recentMembers,
  ] = await Promise.all([
    prisma.membership.count({ where: membershipWhere }),
    prisma.membership.count({
      where: { ...membershipWhere, status: MEMBERSHIP_STATUS.PENDING },
    }),
    prisma.membership.count({
      where: { ...membershipWhere, status: MEMBERSHIP_STATUS.APPROVED },
    }),
    prisma.membership.count({
      where: { ...membershipWhere, status: MEMBERSHIP_STATUS.SUSPENDED },
    }),
    prisma.commute.count(),
    prisma.commute.count({
      where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
    }),
    prisma.booking.count(),
    prisma.report.count({
      where: { status: { in: [REPORT_STATUS.OPEN, REPORT_STATUS.UNDER_REVIEW] } },
    }),
    prisma.membership.findMany({
      where: membershipWhere,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        community: {
          select: { id: true, name: true },
        },
      },
    }),
  ]);

  return {
    totalMembers,
    pendingMembers,
    approvedMembers,
    suspendedMembers,
    totalCommutes,
    activeCommutes,
    totalBookings,
    openReports,
    recentMembers,
  };
};

/**
 * List community members with filtering and search.
 */
exports.listMembers = async (adminUser, query = {}) => {
  const communityId = await getAdminCommunityId(adminUser, query.communityId);
  const { status, search, page = 1, limit = 50 } = query;

  const where = {};
  if (communityId) {
    where.communityId = communityId;
  }
  if (status && Object.values(MEMBERSHIP_STATUS).includes(status)) {
    where.status = status;
  }
  if (search) {
    where.user = {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
      ],
    };
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const take = parseInt(limit, 10);

  const [members, total] = await Promise.all([
    prisma.membership.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        community: {
          select: { id: true, name: true, domain: true },
        },
      },
    }),
    prisma.membership.count({ where }),
  ]);

  return {
    members,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: take,
      totalPages: Math.ceil(total / take) || 1,
    },
  };
};

/**
 * Update member status (Approve, Reject, Suspend) or role.
 */
exports.updateMember = async (adminUser, membershipId, { status, role, isActive }) => {
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: { user: true },
  });

  if (!membership) {
    throw ApiError.notFound('Membership record not found');
  }

  const updateMembershipData = {};
  if (status) {
    if (!Object.values(MEMBERSHIP_STATUS).includes(status)) {
      throw ApiError.badRequest('Invalid membership status');
    }
    updateMembershipData.status = status;
    if (status === MEMBERSHIP_STATUS.APPROVED && !membership.joinedAt) {
      updateMembershipData.joinedAt = new Date();
    }
  }

  // Update user role or active status if provided
  if (role || isActive !== undefined) {
    const updateUserData = {};
    if (role && Object.values(ROLES).includes(role)) {
      updateUserData.role = role;
    }
    if (isActive !== undefined) {
      updateUserData.isActive = Boolean(isActive);
    }

    await prisma.user.update({
      where: { id: membership.userId },
      data: updateUserData,
    });
  }

  const updated = await prisma.membership.update({
    where: { id: membershipId },
    data: updateMembershipData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
        },
      },
      community: true,
    },
  });

  return updated;
};

/**
 * List safety/conduct reports submitted by users.
 */
exports.listReports = async (_adminUser, query = {}) => {
  const { status } = query;
  const where = {};
  if (status && Object.values(REPORT_STATUS).includes(status)) {
    where.status = status;
  }

  return prisma.report.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: {
        select: { id: true, name: true, email: true },
      },
      reported: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

/**
 * Update a report status (Under Review, Resolved, Dismissed).
 */
exports.updateReport = async (_adminUser, reportId, { status, adminNotes }) => {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw ApiError.notFound('Report not found');
  }

  const updateData = {};
  if (status) {
    if (!Object.values(REPORT_STATUS).includes(status)) {
      throw ApiError.badRequest('Invalid report status');
    }
    updateData.status = status;
    if ([REPORT_STATUS.RESOLVED, REPORT_STATUS.DISMISSED].includes(status)) {
      updateData.resolvedAt = new Date();
    }
  }

  if (adminNotes !== undefined) {
    updateData.adminNotes = adminNotes;
  }

  return prisma.report.update({
    where: { id: reportId },
    data: updateData,
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      reported: { select: { id: true, name: true, email: true } },
    },
  });
};

/**
 * List commutes for monitoring and administrative moderation.
 */
exports.listCommutes = async (_adminUser, query = {}) => {
  const { status, origin, destination } = query;
  const where = {};
  if (status) where.status = status;
  if (origin) where.origin = { contains: origin };
  if (destination) where.destination = { contains: destination };

  return prisma.commute.findMany({
    where,
    orderBy: { departureTime: 'desc' },
    take: 100,
    include: {
      driver: {
        select: { id: true, name: true, email: true, phone: true },
      },
      _count: {
        select: { bookings: true },
      },
    },
  });
};
