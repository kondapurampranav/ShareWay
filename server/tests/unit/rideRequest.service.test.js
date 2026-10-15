// tests/unit/rideRequest.service.test.js
// OWNER: Member 3
// Tests publishing, listing, cancelling ride requests, and community discovery.

const rideRequestService = require("../../src/services/rideRequest.service");
const prisma = require("../../src/config/db");
const ApiError = require("../../src/utils/ApiError");
const { RIDE_REQUEST_STATUS, RIDE_OFFER_STATUS } = require("../../src/config/constants");

jest.mock("../../src/config/db", () => ({
  rideRequest: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  rideOffer: {
    updateMany: jest.fn(),
  },
  membership: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn((promises) => Promise.all(promises)),
}));

describe("rideRequest.service", () => {
  const mockPassengerId = "passenger-uuid-111";
  const mockOtherUserId = "other-uuid-222";
  const mockRequestId = "request-uuid-333";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createRideRequest", () => {
    test("publishes a ride request with status OPEN", async () => {
      const input = {
        origin: "South Campus",
        destination: "City Center",
        desiredDeparture: "2026-10-15T10:00:00.000Z",
        maxContribution: 50.0,
        vehiclePreference: "CAR",
        notes: "1 bag",
      };

      const createdRecord = {
        id: mockRequestId,
        passengerId: mockPassengerId,
        ...input,
        desiredDeparture: new Date(input.desiredDeparture),
        status: RIDE_REQUEST_STATUS.OPEN,
      };

      prisma.rideRequest.create.mockResolvedValue(createdRecord);

      const result = await rideRequestService.createRideRequest(mockPassengerId, input);

      expect(prisma.rideRequest.create).toHaveBeenCalledWith({
        data: {
          passengerId: mockPassengerId,
          origin: input.origin,
          destination: input.destination,
          desiredDeparture: new Date(input.desiredDeparture),
          maxContribution: 50.0,
          vehiclePreference: "CAR",
          notes: "1 bag",
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
      expect(result.status).toBe(RIDE_REQUEST_STATUS.OPEN);
      expect(result.passengerId).toBe(mockPassengerId);
    });
  });

  describe("getPassengerRideRequests", () => {
    test("retrieves requests created by the passenger", async () => {
      const mockList = [
        { id: "1", passengerId: mockPassengerId, origin: "A", destination: "B" },
      ];
      prisma.rideRequest.findMany.mockResolvedValue(mockList);

      const result = await rideRequestService.getPassengerRideRequests(mockPassengerId);

      expect(prisma.rideRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { passengerId: mockPassengerId },
        })
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("getRideRequestById", () => {
    test("returns ride request if found", async () => {
      const mockRecord = {
        id: mockRequestId,
        passengerId: mockPassengerId,
        origin: "Origin",
        destination: "Destination",
      };
      prisma.rideRequest.findUnique.mockResolvedValue(mockRecord);

      const result = await rideRequestService.getRideRequestById(mockRequestId);

      expect(result).toEqual(mockRecord);
    });

    test("throws 404 if request not found", async () => {
      prisma.rideRequest.findUnique.mockResolvedValue(null);

      await expect(rideRequestService.getRideRequestById("non-existent")).rejects.toMatchObject({
        statusCode: 404,
        message: "Ride request not found",
      });
    });
  });

  describe("cancelRideRequest", () => {
    test("passenger cancels own ride request successfully and rejects pending offers", async () => {
      const mockRecord = {
        id: mockRequestId,
        passengerId: mockPassengerId,
        status: RIDE_REQUEST_STATUS.OPEN,
      };
      prisma.rideRequest.findUnique.mockResolvedValue(mockRecord);
      prisma.rideRequest.update.mockReturnValue(
        Promise.resolve({ ...mockRecord, status: RIDE_REQUEST_STATUS.CANCELLED })
      );
      prisma.rideOffer.updateMany.mockReturnValue(
        Promise.resolve({ count: 1 })
      );

      const result = await rideRequestService.cancelRideRequest(mockRequestId, mockPassengerId);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.status).toBe(RIDE_REQUEST_STATUS.CANCELLED);
    });

    test("throws 403 if non-passenger tries to cancel", async () => {
      prisma.rideRequest.findUnique.mockResolvedValue({
        id: mockRequestId,
        passengerId: mockPassengerId,
        status: RIDE_REQUEST_STATUS.OPEN,
      });

      await expect(
        rideRequestService.cancelRideRequest(mockRequestId, mockOtherUserId)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: "You are not authorized to cancel this ride request",
      });
    });

    test("throws 400 if already CANCELLED or BOOKING_CONFIRMED", async () => {
      prisma.rideRequest.findUnique.mockResolvedValue({
        id: mockRequestId,
        passengerId: mockPassengerId,
        status: RIDE_REQUEST_STATUS.CANCELLED,
      });

      await expect(
        rideRequestService.cancelRideRequest(mockRequestId, mockPassengerId)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Ride request is already cancelled",
      });

      prisma.rideRequest.findUnique.mockResolvedValue({
        id: mockRequestId,
        passengerId: mockPassengerId,
        status: RIDE_REQUEST_STATUS.BOOKING_CONFIRMED,
      });

      await expect(
        rideRequestService.cancelRideRequest(mockRequestId, mockPassengerId)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Cannot cancel a ride request with a confirmed booking",
      });
    });
  });

  describe("discoverCommunityRideRequests", () => {
    test("discovers eligible requests from other members in the community", async () => {
      prisma.membership.findMany.mockResolvedValue([
        { communityId: "comm-123" },
      ]);
      const mockDiscovered = [
        { id: "req-1", passengerId: mockOtherUserId, status: RIDE_REQUEST_STATUS.OPEN },
      ];
      prisma.rideRequest.findMany.mockResolvedValue(mockDiscovered);

      const result = await rideRequestService.discoverCommunityRideRequests(mockPassengerId);

      expect(prisma.rideRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: RIDE_REQUEST_STATUS.OPEN,
            passengerId: { not: mockPassengerId },
            passenger: {
              memberships: {
                some: {
                  communityId: { in: ["comm-123"] },
                  status: "APPROVED",
                },
              },
            },
          }),
        })
      );
      expect(result).toHaveLength(1);
    });
  });
});
