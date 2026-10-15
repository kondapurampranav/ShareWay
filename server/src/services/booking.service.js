const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const { COMMUTE_STATUS, BOOKING_STATUS } = require("../config/constants");


// Passenger requests a seat on a scheduled commute.
const createBooking = async (passengerId, bookingData) => {
  const { commuteId, seatsBooked = 1, agreedContribution } = bookingData;

  const commute = await prisma.commute.findUnique({
    where: { id: commuteId },
  });

  if (!commute) {
    throw ApiError.notFound("Commute not found");
  }

  if (commute.driverId === passengerId) {
    throw ApiError.badRequest("Drivers cannot book their own commute");
  }

  if (commute.status !== COMMUTE_STATUS.SCHEDULED) {
    throw ApiError.badRequest("Cannot book a commute that is not scheduled");
  }

  if (new Date(commute.departureTime) <= new Date()) {
    throw ApiError.badRequest("Cannot book a commute that has already departed");
  }

  const requestedSeats = Number(seatsBooked) || 1;
  if (commute.availableSeats < requestedSeats) {
    throw ApiError.badRequest("Not enough available seats for this commute");
  }

  const existingActiveBooking = await prisma.booking.findFirst({
    where: {
      commuteId,
      passengerId,
      status: { in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.ACCEPTED] },
    },
  });

  if (existingActiveBooking) {
    throw ApiError.conflict("You already have an active booking for this commute");
  }

  const booking = await prisma.booking.create({
    data: {
      commuteId,
      passengerId,
      driverId: commute.driverId,
      seatsBooked: requestedSeats,
      agreedContribution:
        agreedContribution !== undefined && agreedContribution !== null
          ? agreedContribution
          : commute.contributionPerSeat,
      status: BOOKING_STATUS.PENDING,
    },
    include: {
      commute: true,
      passenger: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      driver: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  return booking;
};


// Retrieves bookings for a user (as passenger by default, or as driver).
const getUserBookings = async (userId, filters = {}) => {
  const where = filters.as === "driver" ? { driverId: userId } : { passengerId: userId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.commuteId) {
    where.commuteId = filters.commuteId;
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      commute: {
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
      passenger: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  return bookings;
};


// Retrieves a single booking by ID.
const getBookingById = async (id, userId) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      commute: {
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
      passenger: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!booking) {
    throw ApiError.notFound("Booking not found");
  }

  if (userId && booking.passengerId !== userId && booking.driverId !== userId) {
    throw ApiError.forbidden("You are not authorized to view this booking");
  }

  return booking;
};


// Updates booking status (ACCEPT, REJECT by driver; CANCEL by passenger or driver).
const updateBookingStatus = async (id, userId, newStatus) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      commute: true,
    },
  });

  if (!booking) {
    throw ApiError.notFound("Booking not found");
  }

  if (newStatus === BOOKING_STATUS.ACCEPTED) {
    if (booking.driverId !== userId) {
      throw ApiError.forbidden("Only the driver can accept booking requests");
    }

    if (booking.status !== BOOKING_STATUS.PENDING) {
      throw ApiError.badRequest(`Only PENDING bookings can be accepted (current: ${booking.status})`);
    }

    // Refresh commute to check current available seats
    const currentCommute = await prisma.commute.findUnique({
      where: { id: booking.commuteId },
    });

    if (!currentCommute || currentCommute.availableSeats < booking.seatsBooked) {
      throw ApiError.badRequest("Not enough available seats to accept this booking");
    }

    const [updatedBooking] = await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status: BOOKING_STATUS.ACCEPTED },
        include: { commute: true },
      }),
      prisma.commute.update({
        where: { id: booking.commuteId },
        data: {
          availableSeats: { decrement: booking.seatsBooked },
        },
      }),
    ]);

    return updatedBooking;
  }

  if (newStatus === BOOKING_STATUS.REJECTED) {
    if (booking.driverId !== userId) {
      throw ApiError.forbidden("Only the driver can reject booking requests");
    }

    if (booking.status !== BOOKING_STATUS.PENDING) {
      throw ApiError.badRequest(`Only PENDING bookings can be rejected (current: ${booking.status})`);
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: BOOKING_STATUS.REJECTED },
      include: { commute: true },
    });

    return updatedBooking;
  }

  if (newStatus === BOOKING_STATUS.CANCELLED) {
    if (booking.passengerId !== userId && booking.driverId !== userId) {
      throw ApiError.forbidden("You are not authorized to cancel this booking");
    }

    if (
      [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.REJECTED].includes(
        booking.status
      )
    ) {
      throw ApiError.badRequest(`Cannot cancel a booking with status ${booking.status}`);
    }

    // If it was already accepted, restore the seats to the commute
    if (booking.status === BOOKING_STATUS.ACCEPTED) {
      const [updatedBooking] = await prisma.$transaction([
        prisma.booking.update({
          where: { id },
          data: {
            status: BOOKING_STATUS.CANCELLED,
            cancelledAt: new Date(),
          },
          include: { commute: true },
        }),
        prisma.commute.update({
          where: { id: booking.commuteId },
          data: {
            availableSeats: { increment: booking.seatsBooked },
          },
        }),
      ]);

      return updatedBooking;
    }

    // If PENDING, just cancel without seat adjustment
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: BOOKING_STATUS.CANCELLED,
        cancelledAt: new Date(),
      },
      include: { commute: true },
    });

    return updatedBooking;
  }

  throw ApiError.badRequest(`Invalid booking status transition: ${newStatus}`);
};


// Marks an accepted booking as completed.
const completeBooking = async (id, userId) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking) {
    throw ApiError.notFound("Booking not found");
  }

  if (booking.driverId !== userId && booking.passengerId !== userId) {
    throw ApiError.forbidden("You are not authorized to complete this booking");
  }

  if (booking.status !== BOOKING_STATUS.ACCEPTED) {
    throw ApiError.badRequest(`Only ACCEPTED bookings can be marked as completed (current: ${booking.status})`);
  }

  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: {
      status: BOOKING_STATUS.COMPLETED,
      completedAt: new Date(),
    },
    include: { commute: true },
  });

  return updatedBooking;
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  completeBooking,
  // Backward compatibility / alias methods
  create: createBooking,
  list: getUserBookings,
  getById: getBookingById,
  updateStatus: updateBookingStatus,
  complete: completeBooking,
};
