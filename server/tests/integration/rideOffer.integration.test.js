// tests/integration/rideOffer.integration.test.js
// OWNER: Member 3

process.env.JWT_SECRET = "test-jwt-secret-key-for-testing";

const express = require("express");
const request = require("supertest");
const rideRequestRoutes = require("../../src/routes/rideRequest.routes");
const rideOfferRoutes = require("../../src/routes/rideOffer.routes");
const errorHandler = require("../../src/middleware/errorHandler");
const prisma = require("../../src/config/db");
const { signToken } = require("../../src/utils/jwt");
const {
  RIDE_OFFER_STATUS,
  RIDE_REQUEST_STATUS,
  BOOKING_STATUS,
  COMMUTE_STATUS,
} = require("../../src/config/constants");

const app = express();
app.use(express.json());
app.use("/api/ride-requests", rideRequestRoutes);
app.use("/api/ride-offers", rideOfferRoutes);
app.use(errorHandler);

jest.mock("../../src/config/db", () => ({
  user: {
    findUnique: jest.fn(),
  },
  rideRequest: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
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
  membership: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn((promises) => Promise.all(promises)),
}));

describe("Driver Ride Offers API", () => {
  const driverId = "c3b2e1a0-4f5a-4b6c-8d7e-9f0a1b2c3d4e";
  const passengerId = "d4c3b2a1-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
  const otherUserId = "e5d4c3b2-6a7b-4c8d-9e0f-1a2b3c4d5e6f";
  const requestId = "f6e5d4c3-7b8c-4d9e-af10-2b3c4d5e6f70";
  const offerId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
  const commuteId = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";

  let driverToken;
  let passengerToken;
  let otherUserToken;

  beforeAll(() => {
    driverToken = signToken({ userId: driverId, role: "MEMBER" });
    passengerToken = signToken({ userId: passengerId, role: "MEMBER" });
    otherUserToken = signToken({ userId: otherUserId, role: "MEMBER" });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.user.findUnique.mockImplementation(({ where }) => {
      if (where.id === driverId) {
        return Promise.resolve({
          id: driverId,
          email: "driver@example.com",
          role: "MEMBER",
          isActive: true,
        });
      }
      if (where.id === passengerId) {
        return Promise.resolve({
          id: passengerId,
          email: "passenger@example.com",
          role: "MEMBER",
          isActive: true,
        });
      }
      if (where.id === otherUserId) {
        return Promise.resolve({
          id: otherUserId,
          email: "other@example.com",
          role: "MEMBER",
          isActive: true,
        });
      }
      return Promise.resolve(null);
    });
  });

  describe("POST /api/ride-requests/:requestId/offers", () => {
    test("driver creates a ride offer (201 Created)", async () => {
      prisma.rideRequest.findUnique.mockResolvedValue({
        id: requestId,
        passengerId,
        status: RIDE_REQUEST_STATUS.OPEN,
        desiredDeparture: new Date(Date.now() + 86400000),
      });
      prisma.rideOffer.findFirst.mockResolvedValue(null);

      const createdOffer = {
        id: offerId,
        driverId,
        rideRequestId: requestId,
        proposedContrib: 50.0,
        status: RIDE_OFFER_STATUS.PENDING,
      };
      prisma.rideOffer.create.mockReturnValue(Promise.resolve(createdOffer));
      prisma.rideRequest.update.mockReturnValue(Promise.resolve({}));

      const res = await request(app)
        .post(`/api/ride-requests/${requestId}/offers`)
        .set("Authorization", `Bearer ${driverToken}`)
        .send({ proposedContrib: 50.0, message: "Can pick you up near gate" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(RIDE_OFFER_STATUS.PENDING);
    });
  });

  describe("GET /api/ride-offers", () => {
    test("driver can list their own ride offers", async () => {
      prisma.rideOffer.findMany.mockResolvedValue([
        { id: offerId, driverId, rideRequestId: requestId, status: RIDE_OFFER_STATUS.PENDING },
      ]);

      const res = await request(app)
        .get("/api/ride-offers")
        .set("Authorization", `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("GET /api/ride-requests/:requestId/offers", () => {
    test("passenger can list offers received for their request", async () => {
      prisma.rideRequest.findUnique.mockResolvedValue({
        id: requestId,
        passengerId,
      });
      prisma.rideOffer.findMany.mockResolvedValue([
        { id: offerId, driverId, rideRequestId: requestId, status: RIDE_OFFER_STATUS.PENDING },
      ]);

      const res = await request(app)
        .get(`/api/ride-requests/${requestId}/offers`)
        .set("Authorization", `Bearer ${passengerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("PATCH /api/ride-offers/:id", () => {
    test("passenger accepts offer: connects to booking workflow (200 OK)", async () => {
      const mockOffer = {
        id: offerId,
        driverId,
        rideRequestId: requestId,
        proposedContrib: 50.0,
        commuteId,
        status: RIDE_OFFER_STATUS.PENDING,
        rideRequest: {
          id: requestId,
          passengerId,
          status: RIDE_REQUEST_STATUS.OFFER_RECEIVED,
        },
      };

      prisma.rideOffer.findUnique.mockResolvedValue(mockOffer);
      prisma.commute.findUnique.mockResolvedValue({
        id: commuteId,
        status: COMMUTE_STATUS.SCHEDULED,
        availableSeats: 2,
      });

      const updatedOffer = { ...mockOffer, status: RIDE_OFFER_STATUS.ACCEPTED };
      const createdBooking = {
        id: "booking-789",
        commuteId,
        driverId,
        passengerId,
        status: BOOKING_STATUS.ACCEPTED,
        agreedContribution: 50.0,
      };

      prisma.rideOffer.update.mockReturnValue(Promise.resolve(updatedOffer));
      prisma.booking.create.mockReturnValue(Promise.resolve(createdBooking));
      prisma.rideRequest.update.mockReturnValue(Promise.resolve({}));
      prisma.rideOffer.updateMany.mockReturnValue(Promise.resolve({ count: 0 }));
      prisma.commute.update.mockReturnValue(Promise.resolve({}));

      const res = await request(app)
        .patch(`/api/ride-offers/${offerId}`)
        .set("Authorization", `Bearer ${passengerToken}`)
        .send({ status: RIDE_OFFER_STATUS.ACCEPTED });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.offer.status).toBe(RIDE_OFFER_STATUS.ACCEPTED);
      expect(res.body.data.booking.status).toBe(BOOKING_STATUS.ACCEPTED);
    });

    test("passenger rejects offer (200 OK)", async () => {
      const mockOffer = {
        id: offerId,
        driverId,
        rideRequestId: requestId,
        status: RIDE_OFFER_STATUS.PENDING,
        rideRequest: {
          id: requestId,
          passengerId,
          status: RIDE_REQUEST_STATUS.OFFER_RECEIVED,
        },
      };

      prisma.rideOffer.findUnique.mockResolvedValue(mockOffer);
      prisma.rideOffer.update.mockReturnValue(
        Promise.resolve({ ...mockOffer, status: RIDE_OFFER_STATUS.REJECTED })
      );
      prisma.rideOffer.findMany.mockReturnValue(Promise.resolve([]));

      const res = await request(app)
        .patch(`/api/ride-offers/${offerId}`)
        .set("Authorization", `Bearer ${passengerToken}`)
        .send({ status: RIDE_OFFER_STATUS.REJECTED });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("DELETE /api/ride-offers/:id", () => {
    test("driver withdraws pending offer (200 OK)", async () => {
      const mockOffer = {
        id: offerId,
        driverId,
        status: RIDE_OFFER_STATUS.PENDING,
      };

      prisma.rideOffer.findUnique.mockResolvedValue(mockOffer);
      prisma.rideOffer.update.mockReturnValue(
        Promise.resolve({ ...mockOffer, status: RIDE_OFFER_STATUS.WITHDRAWN })
      );

      const res = await request(app)
        .delete(`/api/ride-offers/${offerId}`)
        .set("Authorization", `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(RIDE_OFFER_STATUS.WITHDRAWN);
    });
  });
});
