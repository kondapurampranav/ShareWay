// server/src/services/user.service.js
// OWNER: Member 1
// Business logic for user profiles and account management.

const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { sanitizeUser } = require('./auth.service');

/**
 * Get profile of currently authenticated user.
 */
exports.getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          community: true,
        },
      },
    },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return sanitizeUser(user);
};

/**
 * Update current user profile.
 */
exports.updateMe = async (userId, { name, phone, avatarUrl }) => {
  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: {
      memberships: {
        include: {
          community: true,
        },
      },
    },
  });

  return sanitizeUser(user);
};

/**
 * Get public profile by user ID.
 */
exports.getById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
      memberships: {
        where: { status: 'APPROVED' },
        include: {
          community: {
            select: { id: true, name: true },
          },
        },
      },
      ratingsReceived: {
        select: {
          score: true,
          review: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const ratingCount = user.ratingsReceived.length;
  const averageRating =
    ratingCount > 0
      ? user.ratingsReceived.reduce((acc, curr) => acc + curr.score, 0) / ratingCount
      : null;

  return {
    ...user,
    ratingCount,
    averageRating: averageRating ? Number(averageRating.toFixed(1)) : null,
  };
};
