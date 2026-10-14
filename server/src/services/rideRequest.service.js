// server/src/services/rideRequest.service.js
// OWNER: Member 3
// Business logic for passenger ride requests, management, and community discovery.

const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const { RIDE_REQUEST_STATUS, RIDE_OFFER_STATUS } = require("../config/constants");

/**
 * Passenger publishes a new ride request.
 */
const createRideRequest = async (passengerId, requestData) => {
  const {
    origin,
    destination,
    desiredDeparture,
    maxContribution,
    vehiclePreference,
    notes,
  } = requestData;

  const rideRequest = await prisma.rideRequest.create({
    data: {
      passengerId,
      origin,
      destination,
      desiredDeparture: new Date(desiredDeparture),
      maxContribution,
      vehiclePreference: vehiclePreference || null,
      notes: notes || null,
      status: RIDE_REQUEST_STATUS.OPEN,
    },
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
  });

  return rideRequest;
};

/**
 * Retrieves all ride requests created by the passenger.
 */
const getPassengerRideRequests = async (passengerId, filters = {}) => {
  const where = { passengerId };

  if (filters.status) {
    where.status = filters.status;
  }

  const rideRequests = await prisma.rideRequest.findMany({
    where,
    orderBy: { desiredDeparture: "asc" },
    include: {
      passenger: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      rideOffers: {
        select: {
          id: true,
          driverId: true,
          status: true,
          proposedContrib: true,
          createdAt: true,
        },
      },
    },
  });

  return rideRequests;
};

/**
 * Retrieves a single ride request by ID.
 */
const getRideRequestById = async (id) => {
  const rideRequest = await prisma.rideRequest.findUnique({
    where: { id },
    include: {
      passenger: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      rideOffers: {
        select: {
          id: true,
          driverId: true,
          status: true,
          proposedContrib: true,
          message: true,
          createdAt: true,
        },
      },
    },
  });

  if (!rideRequest) {
    throw ApiError.notFound("Ride request not found");
  }

  return rideRequest;
};

/**
 * Passenger cancels their own eligible ride request.
 */
const cancelRideRequest = async (id, passengerId) => {
  const rideRequest = await prisma.rideRequest.findUnique({
    where: { id },
  });

  if (!rideRequest) {
    throw ApiError.notFound("Ride request not found");
  }

  if (rideRequest.passengerId !== passengerId) {
    throw ApiError.forbidden("You are not authorized to cancel this ride request");
  }

  if (rideRequest.status === RIDE_REQUEST_STATUS.CANCELLED) {
    throw ApiError.badRequest("Ride request is already cancelled");
  }

  if (rideRequest.status === RIDE_REQUEST_STATUS.BOOKING_CONFIRMED) {
    throw ApiError.badRequest("Cannot cancel a ride request with a confirmed booking");
  }

  if (rideRequest.status === RIDE_REQUEST_STATUS.EXPIRED) {
    throw ApiError.badRequest("Cannot cancel an expired ride request");
  }

  const [cancelledRequest] = await prisma.$transaction([
    prisma.rideRequest.update({
      where: { id },
      data: { status: RIDE_REQUEST_STATUS.CANCELLED },
      include: { passenger: true },
    }),
    prisma.rideOffer.updateMany({
      where: {
        rideRequestId: id,
        status: RIDE_OFFER_STATUS.PENDING,
      },
      data: {
        status: RIDE_OFFER_STATUS.REJECTED,
      },
    }),
  ]);

  return cancelledRequest;
};

/**
 * Community Discovery: eligible community members discover active ride requests.
 */
const discoverCommunityRideRequests = async (userId, filters = {}) => {
  const userMemberships = await prisma.membership.findMany({
    where: { userId, status: "APPROVED" },
    select: { communityId: true },
  });

  const communityIds = userMemberships.map((m) => m.communityId);

  const where = {
    status: RIDE_REQUEST_STATUS.OPEN,
    desiredDeparture: { gt: new Date() },
    passengerId: { not: userId },
  };

  // If user belongs to approved communities, restrict search to passengers in those communities
  if (communityIds.length > 0) {
    where.passenger = {
      memberships: {
        some: {
          communityId: { in: communityIds },
          status: "APPROVED",
        },
      },
    };
  }

  if (filters.origin && filters.origin.trim()) {
    where.origin = { contains: filters.origin.trim() };
  }

  if (filters.destination && filters.destination.trim()) {
    where.destination = { contains: filters.destination.trim() };
  }

  if (filters.date) {
    const startOfDay = new Date(filters.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(filters.date);
    endOfDay.setHours(23, 59, 59, 999);
    where.desiredDeparture = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  const requests = await prisma.rideRequest.findMany({
    where,
    orderBy: { desiredDeparture: "asc" },
    include: {
      passenger: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      rideOffers: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  return requests;
};

module.exports = {
  createRideRequest,
  getPassengerRideRequests,
  getRideRequestById,
  cancelRideRequest,
  discoverCommunityRideRequests,
  // Backward compatibility / alias methods
  create: createRideRequest,
  list: getPassengerRideRequests,
  getById: getRideRequestById,
  cancel: cancelRideRequest,
  discover: discoverCommunityRideRequests,
};
