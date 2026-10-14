// tests/integration/rideRequest.integration.test.js
// OWNER: Member 3

process.env.JWT_SECRET = "test-jwt-secret-key-for-testing";

const express = require("express");
const request = require("supertest");
const rideRequestRoutes = require("../../src/routes/rideRequest.routes");
const errorHandler = require("../../src/middleware/errorHandler");
const prisma = require("../../src/config/db");
const { signToken } = require("../../src/utils/jwt");
const { RIDE_REQUEST_STATUS } = require("../../src/config/constants");

const app = express();
app.use(express.json());
app.use("/api/ride-requests", rideRequestRoutes);
app.use(errorHandler);

jest.mock("../../src/config/db", () => ({
  user: {
    findUnique: jest.fn(),
  },
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

describe("Ride Request API (/api/ride-requests)", () => {
  const passengerId = "c3b2e1a0-4f5a-4b6c-8d7e-9f0a1b2c3d4e";
  const otherUserId = "d4c3b2a1-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
  const requestId = "e5d4c3b2-6a7b-4c8d-9e0f-1a2b3c4d5e6f";

  let passengerToken;
  let otherUserToken;

  beforeAll(() => {
    passengerToken = signToken({ userId: passengerId, role: "MEMBER" });
    otherUserToken = signToken({ userId: otherUserId, role: "MEMBER" });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.user.findUnique.mockImplementation(({ where }) => {
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

  describe("POST /api/ride-requests", () => {
    const validPayload = {
      origin: "Library",
      destination: "Hostel Block B",
      desiredDeparture: new Date(Date.now() + 86400000).toISOString(),
      maxContribution: 45.0,
      vehiclePreference: "CAR",
      notes: "Heading after evening study session",
    };

    test("returns 401 when no token is provided", async () => {
      const res = await request(app)
        .post("/api/ride-requests")
        .send(validPayload);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test("returns 400 when validation fails", async () => {
      const res = await request(app)
        .post("/api/ride-requests")
        .set("Authorization", `Bearer ${passengerToken}`)
        .send({ origin: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test("publishes a ride request (201 Created)", async () => {
      const createdRecord = {
        id: requestId,
        passengerId,
        ...validPayload,
        desiredDeparture: new Date(validPayload.desiredDeparture),
        status: RIDE_REQUEST_STATUS.OPEN,
      };
      prisma.rideRequest.create.mockResolvedValue(createdRecord);

      const res = await request(app)
        .post("/api/ride-requests")
        .set("Authorization", `Bearer ${passengerToken}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.passengerId).toBe(passengerId);
      expect(res.body.data.status).toBe(RIDE_REQUEST_STATUS.OPEN);
    });
  });

  describe("GET /api/ride-requests", () => {
    test("returns passenger's own ride requests", async () => {
      const mockList = [
        { id: requestId, passengerId, origin: "A", destination: "B" },
      ];
      prisma.rideRequest.findMany.mockResolvedValue(mockList);

      const res = await request(app)
        .get("/api/ride-requests")
        .set("Authorization", `Bearer ${passengerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("GET /api/ride-requests/discover", () => {
    test("community members can discover open requests from others", async () => {
      prisma.membership.findMany.mockResolvedValue([{ communityId: "comm-1" }]);
      prisma.rideRequest.findMany.mockResolvedValue([
        { id: requestId, passengerId: otherUserId, origin: "A", destination: "B" },
      ]);

      const res = await request(app)
        .get("/api/ride-requests/discover")
        .set("Authorization", `Bearer ${passengerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("GET /api/ride-requests/:id", () => {
    test("returns 404 when ride request not found", async () => {
      prisma.rideRequest.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/ride-requests/${requestId}`)
        .set("Authorization", `Bearer ${passengerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test("returns 200 with ride request details when found", async () => {
      prisma.rideRequest.findUnique.mockResolvedValue({
        id: requestId,
        passengerId,
        origin: "Origin",
        destination: "Destination",
      });

      const res = await request(app)
        .get(`/api/ride-requests/${requestId}`)
        .set("Authorization", `Bearer ${passengerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(requestId);
    });
  });

  describe("DELETE /api/ride-requests/:id", () => {
    test("returns 403 when non-passenger attempts to cancel", async () => {
      prisma.rideRequest.findUnique.mockResolvedValue({
        id: requestId,
        passengerId,
        status: RIDE_REQUEST_STATUS.OPEN,
      });

      const res = await request(app)
        .delete(`/api/ride-requests/${requestId}`)
        .set("Authorization", `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test("returns 200 when passenger cancels own ride request", async () => {
      prisma.rideRequest.findUnique.mockResolvedValue({
        id: requestId,
        passengerId,
        status: RIDE_REQUEST_STATUS.OPEN,
      });
      prisma.rideRequest.update.mockResolvedValue({
        id: requestId,
        passengerId,
        status: RIDE_REQUEST_STATUS.CANCELLED,
      });
      prisma.rideOffer.updateMany.mockResolvedValue({ count: 0 });

      const res = await request(app)
        .delete(`/api/ride-requests/${requestId}`)
        .set("Authorization", `Bearer ${passengerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("cancelled");
    });
  });
});
