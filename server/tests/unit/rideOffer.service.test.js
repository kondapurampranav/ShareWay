// tests/unit/rideOffer.service.test.js
// OWNER: Member 3
// Tests driver ride offers, passenger acceptance/rejection, overbooking prevention, and booking integration.

const rideOfferService = require("../../src/services/rideOffer.service");
const prisma = require("../../src/config/db");
const ApiError = require("../../src/utils/ApiError");
const {
  RIDE_OFFER_STATUS,
  RIDE_REQUEST_STATUS,
  BOOKING_STATUS,
  COMMUTE_STATUS,
} = require("../../src/config/constants");

jest.mock("../../src/config/db", () => ({
  rideRequest: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  rideOffer: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  commute: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  booking: {
    create: jest.fn(),
  },
  $transaction: jest.fn((promises) => Promise.all(promises)),
}));

describe("rideOffer.service", () => {
  const mockDriverId = "driver-uuid-111";
  const mockPassengerId = "passenger-uuid-222";
  const mockOtherUserId = "other-uuid-333";
  const mockRequestId = "request-uuid-444";
  const mockOfferId = "offer-uuid-555";
  const mockCommuteId = "commute-uuid-666";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createRideOffer", () => {
    test("driver creates offer on active passenger request (happy path)", async () => {
      const mockRequest = {
        id: mockRequestId,
        passengerId: mockPassengerId,
        status: RIDE_REQUEST_STATUS.OPEN,
        desiredDeparture: new Date(Date.now() + 86400000),
      };

      prisma.rideRequest.findUnique.mockResolvedValue(mockRequest);
      prisma.rideOffer.findFirst.mockResolvedValue(null);

      const createdOffer = {
        id: mockOfferId,
        driverId: mockDriverId,
        rideRequestId: mockRequestId,
        proposedContrib: 40.0,
        status: RIDE_OFFER_STATUS.PENDING,
      };

      prisma.rideOffer.create.mockReturnValue(Promise.resolve(createdOffer));
      prisma.rideRequest.update.mockReturnValue(
        Promise.resolve({ ...mockRequest, status: RIDE_REQUEST_STATUS.OFFER_RECEIVED })
      );

      const result = await rideOfferService.createRideOffer(mockDriverId, {
        rideRequestId: mockRequestId,
        proposedContrib: 40.0,
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.status).toBe(RIDE_OFFER_STATUS.PENDING);
    });

    test("prevents driver from offering on their own ride request", async () => {
      prisma.rideRequest.findUnique.mockResolvedValue({
        id: mockRequestId,
        passengerId: mockDriverId,
        status: RIDE_REQUEST_STATUS.OPEN,
        desiredDeparture: new Date(Date.now() + 86400000),
      });

      await expect(
        rideOfferService.createRideOffer(mockDriverId, {
          rideRequestId: mockRequestId,
          proposedContrib: 40.0,
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Drivers cannot make offers on their own ride requests",
      });
    });

    test("prevents duplicate pending offer from same driver on same request", async () => {
      prisma.rideRequest.findUnique.mockResolvedValue({
        id: mockRequestId,
        passengerId: mockPassengerId,
        status: RIDE_REQUEST_STATUS.OPEN,
        desiredDeparture: new Date(Date.now() + 86400000),
      });
      prisma.rideOffer.findFirst.mockResolvedValue({ id: "existing-offer" });

      await expect(
        rideOfferService.createRideOffer(mockDriverId, {
          rideRequestId: mockRequestId,
          proposedContrib: 40.0,
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "You already have a pending offer for this ride request",
      });
    });

    test("rejects offer if linked commute has no available seats", async () => {
      prisma.rideRequest.findUnique.mockResolvedValue({
        id: mockRequestId,
        passengerId: mockPassengerId,
        status: RIDE_REQUEST_STATUS.OPEN,
        desiredDeparture: new Date(Date.now() + 86400000),
      });
      prisma.rideOffer.findFirst.mockResolvedValue(null);
      prisma.commute.findUnique.mockResolvedValue({
        id: mockCommuteId,
        driverId: mockDriverId,
        status: COMMUTE_STATUS.SCHEDULED,
        availableSeats: 0,
      });

      await expect(
        rideOfferService.createRideOffer(mockDriverId, {
          rideRequestId: mockRequestId,
          proposedContrib: 40.0,
          commuteId: mockCommuteId,
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Linked commute has no available seats remaining",
      });
    });
  });

  describe("respondToOffer", () => {
    test("passenger accepts offer: updates offer, creates Booking, updates request, auto-rejects others", async () => {
      const mockOffer = {
        id: mockOfferId,
        driverId: mockDriverId,
        rideRequestId: mockRequestId,
        proposedContrib: 45.0,
        commuteId: mockCommuteId,
        status: RIDE_OFFER_STATUS.PENDING,
        rideRequest: {
          id: mockRequestId,
          passengerId: mockPassengerId,
          status: RIDE_REQUEST_STATUS.OFFER_RECEIVED,
        },
      };

      prisma.rideOffer.findUnique.mockResolvedValue(mockOffer);
      prisma.commute.findUnique.mockResolvedValue({
        id: mockCommuteId,
        status: COMMUTE_STATUS.SCHEDULED,
        availableSeats: 2,
      });

      const updatedOffer = { ...mockOffer, status: RIDE_OFFER_STATUS.ACCEPTED };
      const createdBooking = {
        id: "booking-123",
        commuteId: mockCommuteId,
        driverId: mockDriverId,
        passengerId: mockPassengerId,
        status: BOOKING_STATUS.ACCEPTED,
        agreedContribution: 45.0,
      };

      prisma.rideOffer.update.mockReturnValue(Promise.resolve(updatedOffer));
      prisma.booking.create.mockReturnValue(Promise.resolve(createdBooking));
      prisma.rideRequest.update.mockReturnValue(Promise.resolve({}));
      prisma.rideOffer.updateMany.mockReturnValue(Promise.resolve({ count: 1 }));
      prisma.commute.update.mockReturnValue(Promise.resolve({}));

      const result = await rideOfferService.respondToOffer(
        mockOfferId,
        mockPassengerId,
        RIDE_OFFER_STATUS.ACCEPTED
      );

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.offer.status).toBe(RIDE_OFFER_STATUS.ACCEPTED);
      expect(result.booking.status).toBe(BOOKING_STATUS.ACCEPTED);
    });

    test("prevents overbooking: rejects acceptance if linked commute seats became 0", async () => {
      const mockOffer = {
        id: mockOfferId,
        driverId: mockDriverId,
        rideRequestId: mockRequestId,
        proposedContrib: 45.0,
        commuteId: mockCommuteId,
        status: RIDE_OFFER_STATUS.PENDING,
        rideRequest: {
          id: mockRequestId,
          passengerId: mockPassengerId,
          status: RIDE_REQUEST_STATUS.OFFER_RECEIVED,
        },
      };

      prisma.rideOffer.findUnique.mockResolvedValue(mockOffer);
      prisma.commute.findUnique.mockResolvedValue({
        id: mockCommuteId,
        status: COMMUTE_STATUS.SCHEDULED,
        availableSeats: 0,
      });

      await expect(
        rideOfferService.respondToOffer(mockOfferId, mockPassengerId, RIDE_OFFER_STATUS.ACCEPTED)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Linked commute has no available seats remaining",
      });
    });

    test("throws 403 if non-passenger attempts to accept/reject offer", async () => {
      const mockOffer = {
        id: mockOfferId,
        driverId: mockDriverId,
        rideRequestId: mockRequestId,
        status: RIDE_OFFER_STATUS.PENDING,
        rideRequest: {
          id: mockRequestId,
          passengerId: mockPassengerId,
          status: RIDE_REQUEST_STATUS.OFFER_RECEIVED,
        },
      };

      prisma.rideOffer.findUnique.mockResolvedValue(mockOffer);

      await expect(
        rideOfferService.respondToOffer(mockOfferId, mockOtherUserId, RIDE_OFFER_STATUS.ACCEPTED)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: "Only the passenger who created the ride request can respond to this offer",
      });
    });

    test("passenger rejects offer: updates offer to REJECTED", async () => {
      const mockOffer = {
        id: mockOfferId,
        driverId: mockDriverId,
        rideRequestId: mockRequestId,
        status: RIDE_OFFER_STATUS.PENDING,
        rideRequest: {
          id: mockRequestId,
          passengerId: mockPassengerId,
          status: RIDE_REQUEST_STATUS.OFFER_RECEIVED,
        },
      };

      prisma.rideOffer.findUnique.mockResolvedValue(mockOffer);
      prisma.rideOffer.update.mockReturnValue(
        Promise.resolve({ ...mockOffer, status: RIDE_OFFER_STATUS.REJECTED })
      );
      prisma.rideOffer.findMany.mockReturnValue(Promise.resolve([]));

      const result = await rideOfferService.respondToOffer(
        mockOfferId,
        mockPassengerId,
        RIDE_OFFER_STATUS.REJECTED
      );

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.status).toBe(RIDE_OFFER_STATUS.REJECTED);
    });
  });

  describe("withdrawOffer", () => {
    test("driver withdraws pending offer successfully", async () => {
      const mockOffer = {
        id: mockOfferId,
        driverId: mockDriverId,
        status: RIDE_OFFER_STATUS.PENDING,
      };

      prisma.rideOffer.findUnique.mockResolvedValue(mockOffer);
      prisma.rideOffer.update.mockReturnValue(
        Promise.resolve({ ...mockOffer, status: RIDE_OFFER_STATUS.WITHDRAWN })
      );

      const result = await rideOfferService.withdrawOffer(mockOfferId, mockDriverId);

      expect(result.status).toBe(RIDE_OFFER_STATUS.WITHDRAWN);
    });

    test("throws 403 if non-driver tries to withdraw", async () => {
      prisma.rideOffer.findUnique.mockResolvedValue({
        id: mockOfferId,
        driverId: mockDriverId,
        status: RIDE_OFFER_STATUS.PENDING,
      });

      await expect(
        rideOfferService.withdrawOffer(mockOfferId, mockOtherUserId)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: "You are not authorized to withdraw this offer",
      });
    });
  });
});
