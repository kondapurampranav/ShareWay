// server/src/services/commute.service.js
// OWNER: Member 2
// Business logic for driver commute management and booking rules.

const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const { COMMUTE_STATUS, BOOKING_STATUS } = require("../config/constants");

/**
 * Creates a new commute for the authenticated driver.
 */
const createCommute = async (driverId, commuteData) => {
  const {
    origin,
    destination,
    departureTime,
    vehicleType,
    totalSeats,
    contributionPerSeat,
    notes,
    recurringScheduleId,
  } = commuteData;

  const commute = await prisma.commute.create({
    data: {
      driverId,
      origin,
      destination,
      departureTime: new Date(departureTime),
      vehicleType,
      totalSeats,
      availableSeats: totalSeats,
      contributionPerSeat,
      status: COMMUTE_STATUS.SCHEDULED,
      notes: notes || null,
      recurringScheduleId: recurringScheduleId || null,
    },
  });

  return commute;
};

/**
 * Retrieves all commutes created by the authenticated driver.
 */
const getDriverCommutes = async (driverId, filters = {}) => {
  const where = { driverId };

  if (filters.status) {
    where.status = filters.status;
  }

  const commutes = await prisma.commute.findMany({
    where,
    orderBy: { departureTime: "asc" },
    include: {
      bookings: {
        select: {
          id: true,
          passengerId: true,
          status: true,
          seatsBooked: true,
          agreedContribution: true,
        },
      },
    },
  });

  return commutes;
};

/**
 * Retrieves a single commute by ID.
 */
const getCommuteById = async (id) => {
  const commute = await prisma.commute.findUnique({
    where: { id },
    include: {
      driver: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      bookings: {
        select: {
          id: true,
          passengerId: true,
          status: true,
          seatsBooked: true,
          agreedContribution: true,
          createdAt: true,
        },
      },
    },
  });

  if (!commute) {
    throw ApiError.notFound("Commute not found");
  }

  return commute;
};

/**
 * Updates a driver's own commute, ensuring booking rules and seat capacities are respected.
 */
const updateCommute = async (id, driverId, updateData) => {
  const commute = await prisma.commute.findUnique({
    where: { id },
    include: {
      bookings: true,
    },
  });

  if (!commute) {
    throw ApiError.notFound("Commute not found");
  }

  if (commute.driverId !== driverId) {
    throw ApiError.forbidden("You are not authorized to modify this commute");
  }

  if (commute.status === COMMUTE_STATUS.COMPLETED) {
    throw ApiError.badRequest("Cannot modify a completed commute");
  }

  if (commute.status === COMMUTE_STATUS.CANCELLED) {
    throw ApiError.badRequest("Cannot modify a cancelled commute");
  }

  const dataToUpdate = {};

  if (updateData.origin !== undefined) dataToUpdate.origin = updateData.origin;
  if (updateData.destination !== undefined) dataToUpdate.destination = updateData.destination;
  if (updateData.departureTime !== undefined) dataToUpdate.departureTime = new Date(updateData.departureTime);
  if (updateData.vehicleType !== undefined) dataToUpdate.vehicleType = updateData.vehicleType;
  if (updateData.contributionPerSeat !== undefined) dataToUpdate.contributionPerSeat = updateData.contributionPerSeat;
  if (updateData.notes !== undefined) dataToUpdate.notes = updateData.notes;

  if (updateData.totalSeats !== undefined) {
    const activeBookings = (commute.bookings || []).filter(
      (b) => b.status === BOOKING_STATUS.ACCEPTED
    );
    const bookedSeats = activeBookings.reduce((sum, b) => sum + (b.seatsBooked || 1), 0);

    if (updateData.totalSeats < bookedSeats) {
      throw ApiError.badRequest(
        `Total seats cannot be less than already booked seats (${bookedSeats})`
      );
    }

    dataToUpdate.totalSeats = updateData.totalSeats;
    dataToUpdate.availableSeats = updateData.totalSeats - bookedSeats;
  }

  const updatedCommute = await prisma.commute.update({
    where: { id },
    data: dataToUpdate,
  });

  return updatedCommute;
};

/**
 * Cancels a driver's own commute and cancels any active bookings.
 */
const cancelCommute = async (id, driverId) => {
  const commute = await prisma.commute.findUnique({
    where: { id },
    include: {
      bookings: true,
    },
  });

  if (!commute) {
    throw ApiError.notFound("Commute not found");
  }

  if (commute.driverId !== driverId) {
    throw ApiError.forbidden("You are not authorized to cancel this commute");
  }

  if (commute.status === COMMUTE_STATUS.COMPLETED) {
    throw ApiError.badRequest("Cannot cancel a completed commute");
  }

  if (commute.status === COMMUTE_STATUS.CANCELLED) {
    throw ApiError.badRequest("Commute is already cancelled");
  }

  const [cancelledCommute] = await prisma.$transaction([
    prisma.commute.update({
      where: { id },
      data: { status: COMMUTE_STATUS.CANCELLED },
    }),
    prisma.booking.updateMany({
      where: {
        commuteId: id,
        status: { in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.ACCEPTED] },
      },
      data: {
        status: BOOKING_STATUS.CANCELLED,
        cancelledAt: new Date(),
      },
    }),
  ]);

  return cancelledCommute;
};

module.exports = {
  createCommute,
  getDriverCommutes,
  getCommuteById,
  updateCommute,
  cancelCommute,
  // Alias for backward-compatible naming in controllers
  list: getDriverCommutes,
  create: createCommute,
  getById: getCommuteById,
  update: updateCommute,
  cancel: cancelCommute,
};
