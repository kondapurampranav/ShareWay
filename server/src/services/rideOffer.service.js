// server/src/services/rideOffer.service.js
// OWNER: Member 3
// Business logic for driver ride offers, passenger responses, and booking integration.

const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const {
  RIDE_OFFER_STATUS,
  RIDE_REQUEST_STATUS,
  BOOKING_STATUS,
  COMMUTE_STATUS,
  VEHICLE_TYPE,
} = require("../config/constants");

/**
 * Driver creates a ride offer for a passenger ride request.
 */
const createRideOffer = async (driverId, offerData) => {
  const { rideRequestId, proposedContrib, commuteId, message } = offerData;

  const rideRequest = await prisma.rideRequest.findUnique({
    where: { id: rideRequestId },
  });

  if (!rideRequest) {
    throw ApiError.notFound("Ride request not found");
  }

  if (rideRequest.passengerId === driverId) {
    throw ApiError.badRequest("Drivers cannot make offers on their own ride requests");
  }

  if (
    ![RIDE_REQUEST_STATUS.OPEN, RIDE_REQUEST_STATUS.OFFER_RECEIVED].includes(rideRequest.status)
  ) {
    throw ApiError.badRequest("Cannot make an offer on an inactive or confirmed ride request");
  }

  if (new Date(rideRequest.desiredDeparture) <= new Date()) {
    throw ApiError.badRequest("Cannot make an offer on a past ride request");
  }

  const existingPendingOffer = await prisma.rideOffer.findFirst({
    where: {
      rideRequestId,
      driverId,
      status: RIDE_OFFER_STATUS.PENDING,
    },
  });

  if (existingPendingOffer) {
    throw ApiError.conflict("You already have a pending offer for this ride request");
  }

  if (commuteId) {
    const commute = await prisma.commute.findUnique({
      where: { id: commuteId },
    });

    if (!commute) {
      throw ApiError.notFound("Commute not found");
    }

    if (commute.driverId !== driverId) {
      throw ApiError.forbidden("You can only link your own commute");
    }

    if (commute.status !== COMMUTE_STATUS.SCHEDULED) {
      throw ApiError.badRequest("Linked commute must be scheduled");
    }

    if (commute.availableSeats < 1) {
      throw ApiError.badRequest("Linked commute has no available seats remaining");
    }
  }

  const [offer] = await prisma.$transaction([
    prisma.rideOffer.create({
      data: {
        driverId,
        rideRequestId,
        commuteId: commuteId || null,
        proposedContrib,
        message: message || null,
        status: RIDE_OFFER_STATUS.PENDING,
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        rideRequest: true,
      },
    }),
    prisma.rideRequest.update({
      where: { id: rideRequestId },
      data: { status: RIDE_REQUEST_STATUS.OFFER_RECEIVED },
    }),
  ]);

  return offer;
};

/**
 * Retrieves all offers made by a driver.
 */
const getDriverOffers = async (driverId, filters = {}) => {
  const where = { driverId };

  if (filters.status) {
    where.status = filters.status;
  }

  const offers = await prisma.rideOffer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      rideRequest: {
        include: {
          passenger: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return offers;
};

/**
 * Retrieves all offers received for a specific ride request.
 */
const getOffersForRequest = async (rideRequestId, userId) => {
  const rideRequest = await prisma.rideRequest.findUnique({
    where: { id: rideRequestId },
  });

  if (!rideRequest) {
    throw ApiError.notFound("Ride request not found");
  }

  const where = { rideRequestId };

  // If user is not the passenger, only show the user's own offer (if any)
  if (rideRequest.passengerId !== userId) {
    where.driverId = userId;
  }

  const offers = await prisma.rideOffer.findMany({
    where,
    orderBy: { createdAt: "desc" },
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
  });

  return offers;
};

/**
 * Retrieves a single ride offer by ID.
 */
const getRideOfferById = async (id, userId) => {
  const offer = await prisma.rideOffer.findUnique({
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
      rideRequest: {
        include: {
          passenger: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (!offer) {
    throw ApiError.notFound("Ride offer not found");
  }

  if (userId && offer.driverId !== userId && offer.rideRequest.passengerId !== userId) {
    throw ApiError.forbidden("You are not authorized to view this ride offer");
  }

  return offer;
};

/**
 * Passenger accepts or rejects an offer on their ride request.
 * On acceptance: integrates with Booking workflow and prevents overbooking.
 */
const respondToOffer = async (offerId, passengerId, status) => {
  const offer = await prisma.rideOffer.findUnique({
    where: { id: offerId },
    include: {
      rideRequest: true,
      driver: true,
    },
  });

  if (!offer) {
    throw ApiError.notFound("Ride offer not found");
  }

  if (offer.rideRequest.passengerId !== passengerId) {
    throw ApiError.forbidden("Only the passenger who created the ride request can respond to this offer");
  }

  if (offer.status !== RIDE_OFFER_STATUS.PENDING) {
    throw ApiError.badRequest(`Cannot respond to an offer with status ${offer.status}`);
  }

  if (
    ![RIDE_REQUEST_STATUS.OPEN, RIDE_REQUEST_STATUS.OFFER_RECEIVED].includes(offer.rideRequest.status)
  ) {
    throw ApiError.badRequest("Ride request is no longer active");
  }

  if (status === RIDE_OFFER_STATUS.REJECTED) {
    const [updatedOffer] = await prisma.$transaction([
      prisma.rideOffer.update({
        where: { id: offerId },
        data: { status: RIDE_OFFER_STATUS.REJECTED },
      }),
      // Revert request status to OPEN if no other pending offers exist
      prisma.rideOffer.findMany({
        where: {
          rideRequestId: offer.rideRequestId,
          status: RIDE_OFFER_STATUS.PENDING,
          id: { not: offerId },
        },
      }),
    ]);

    return updatedOffer;
  }

  if (status === RIDE_OFFER_STATUS.ACCEPTED) {
    let targetCommuteId = offer.commuteId;

    if (targetCommuteId) {
      const commute = await prisma.commute.findUnique({
        where: { id: targetCommuteId },
      });

      if (!commute || commute.status !== COMMUTE_STATUS.SCHEDULED) {
        throw ApiError.badRequest("Linked commute is no longer available");
      }

      if (commute.availableSeats < 1) {
        throw ApiError.badRequest("Linked commute has no available seats remaining");
      }
    } else {
      // Connect to booking workflow: create a scheduled commute for the journey
      const autoCommute = await prisma.commute.create({
        data: {
          driverId: offer.driverId,
          origin: offer.rideRequest.origin,
          destination: offer.rideRequest.destination,
          departureTime: offer.rideRequest.desiredDeparture,
          vehicleType: offer.rideRequest.vehiclePreference || VEHICLE_TYPE.CAR,
          totalSeats: 1,
          availableSeats: 0,
          contributionPerSeat: offer.proposedContrib,
          status: COMMUTE_STATUS.SCHEDULED,
          notes: "Generated from accepted ride offer",
        },
      });
      targetCommuteId = autoCommute.id;
    }

    const transactionSteps = [
      prisma.rideOffer.update({
        where: { id: offerId },
        data: { status: RIDE_OFFER_STATUS.ACCEPTED },
      }),
      prisma.booking.create({
        data: {
          commuteId: targetCommuteId,
          passengerId: offer.rideRequest.passengerId,
          driverId: offer.driverId,
          status: BOOKING_STATUS.ACCEPTED,
          agreedContribution: offer.proposedContrib,
          seatsBooked: 1,
        },
      }),
      prisma.rideRequest.update({
        where: { id: offer.rideRequestId },
        data: { status: RIDE_REQUEST_STATUS.BOOKING_CONFIRMED },
      }),
      // Auto-reject any other pending offers on this ride request
      prisma.rideOffer.updateMany({
        where: {
          rideRequestId: offer.rideRequestId,
          id: { not: offerId },
          status: RIDE_OFFER_STATUS.PENDING,
        },
        data: { status: RIDE_OFFER_STATUS.REJECTED },
      }),
    ];

    if (offer.commuteId) {
      // Decrement seat from existing linked commute
      transactionSteps.push(
        prisma.commute.update({
          where: { id: offer.commuteId },
          data: { availableSeats: { decrement: 1 } },
        })
      );
    }

    const [updatedOffer, booking] = await prisma.$transaction(transactionSteps);

    return {
      offer: updatedOffer,
      booking,
    };
  }

  throw ApiError.badRequest(`Invalid status: ${status}`);
};

/**
 * Driver withdraws their pending ride offer.
 */
const withdrawOffer = async (offerId, driverId) => {
  const offer = await prisma.rideOffer.findUnique({
    where: { id: offerId },
    include: { rideRequest: true },
  });

  if (!offer) {
    throw ApiError.notFound("Ride offer not found");
  }

  if (offer.driverId !== driverId) {
    throw ApiError.forbidden("You are not authorized to withdraw this offer");
  }

  if (offer.status !== RIDE_OFFER_STATUS.PENDING) {
    throw ApiError.badRequest(`Cannot withdraw an offer with status ${offer.status}`);
  }

  const [withdrawnOffer] = await prisma.$transaction([
    prisma.rideOffer.update({
      where: { id: offerId },
      data: { status: RIDE_OFFER_STATUS.WITHDRAWN },
    }),
  ]);

  return withdrawnOffer;
};

module.exports = {
  createRideOffer,
  getDriverOffers,
  getOffersForRequest,
  getRideOfferById,
  respondToOffer,
  withdrawOffer,
  // Backward compatibility / alias methods
  create: createRideOffer,
  list: getDriverOffers,
  getById: getRideOfferById,
  respond: respondToOffer,
  withdraw: withdrawOffer,
};
