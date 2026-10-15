// tests/integration/commute.integration.test.js
// OWNER: Member 2

process.env.JWT_SECRET = "test-jwt-secret-key-for-testing";

const express = require("express");
const request = require("supertest");
const commuteRoutes = require("../../src/routes/commute.routes");
const errorHandler = require("../../src/middleware/errorHandler");
const prisma = require("../../src/config/db");
const { signToken } = require("../../src/utils/jwt");
const { COMMUTE_STATUS, BOOKING_STATUS } = require("../../src/config/constants");

// Build isolated Express app for Commute integration testing
// This prevents failures caused by teammates' unfinished route stubs
const app = express();
app.use(express.json());
app.use("/api/commutes", commuteRoutes);
app.use(errorHandler);

jest.mock("../../src/config/db", () => ({
  user: {
    findUnique: jest.fn(),
  },
  commute: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  booking: {
    updateMany: jest.fn(),
  },
  $transaction: jest.fn((promises) => Promise.all(promises)),
}));

describe("Commute API (/api/commutes)", () => {
  const driverId = "c3b2e1a0-4f5a-4b6c-8d7e-9f0a1b2c3d4e";
  const otherUserId = "d4c3b2a1-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
  const commuteId = "e5d4c3b2-6a7b-4c8d-9e0f-1a2b3c4d5e6f";

  let driverToken;
  let otherUserToken;

  beforeAll(() => {
    driverToken = signToken({ userId: driverId, role: "MEMBER" });
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

  describe("POST /api/commutes", () => {
    const validCommutePayload = {
      origin: "Main Gate",
      destination: "Technology Park",
      departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      vehicleType: "CAR",
      totalSeats: 3,
      contributionPerSeat: 75.5,
      notes: "Leaving strictly on time",
    };

    test("returns 401 when no token is provided", async () => {
      const res = await request(app)
        .post("/api/commutes")
        .send(validCommutePayload);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test("returns 400 when validation fails (e.g., missing required fields)", async () => {
      const res = await request(app)
        .post("/api/commutes")
        .set("Authorization", `Bearer ${driverToken}`)
        .send({
          origin: "",
          totalSeats: 0,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    test("creates a commute for the authenticated driver (201 Created)", async () => {
      const createdRecord = {
        id: commuteId,
        driverId,
        ...validCommutePayload,
        departureTime: new Date(validCommutePayload.departureTime),
        availableSeats: 3,
        status: COMMUTE_STATUS.SCHEDULED,
      };
      prisma.commute.create.mockResolvedValue(createdRecord);

      const res = await request(app)
        .post("/api/commutes")
        .set("Authorization", `Bearer ${driverToken}`)
        .send(validCommutePayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.driverId).toBe(driverId);
      expect(res.body.data.availableSeats).toBe(3);
      expect(prisma.commute.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            driverId,
            origin: validCommutePayload.origin,
            destination: validCommutePayload.destination,
            totalSeats: 3,
            availableSeats: 3,
          }),
        })
      );
    });
  });

  describe("GET /api/commutes", () => {
    test("returns 200 with list of driver's commutes", async () => {
      const mockCommutes = [
        { id: commuteId, driverId, origin: "Origin 1", destination: "Dest 1" },
      ];
      prisma.commute.findMany.mockResolvedValue(mockCommutes);

      const res = await request(app)
        .get("/api/commutes")
        .set("Authorization", `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(prisma.commute.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { driverId },
        })
      );
    });
  });

  describe("GET /api/commutes/:id", () => {
    test("returns 400 if ID is not a valid UUID", async () => {
      const res = await request(app)
        .get("/api/commutes/not-a-valid-uuid")
        .set("Authorization", `Bearer ${driverToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test("returns 404 when commute is not found", async () => {
      prisma.commute.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/commutes/${commuteId}`)
        .set("Authorization", `Bearer ${driverToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test("returns 200 with commute details when found", async () => {
      prisma.commute.findUnique.mockResolvedValue({
        id: commuteId,
        driverId,
        origin: "Origin",
        destination: "Destination",
      });

      const res = await request(app)
        .get(`/api/commutes/${commuteId}`)
        .set("Authorization", `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(commuteId);
    });
  });

  describe("PUT /api/commutes/:id", () => {
    test("returns 403 when user is not the driver of the commute", async () => {
      prisma.commute.findUnique.mockResolvedValue({
        id: commuteId,
        driverId,
        status: COMMUTE_STATUS.SCHEDULED,
        bookings: [],
      });

      const res = await request(app)
        .put(`/api/commutes/${commuteId}`)
        .set("Authorization", `Bearer ${otherUserToken}`)
        .send({ notes: "Attempt to update someone else's commute" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test("returns 200 when driver updates own commute", async () => {
      prisma.commute.findUnique.mockResolvedValue({
        id: commuteId,
        driverId,
        status: COMMUTE_STATUS.SCHEDULED,
        totalSeats: 3,
        availableSeats: 3,
        bookings: [],
      });
      prisma.commute.update.mockResolvedValue({
        id: commuteId,
        driverId,
        status: COMMUTE_STATUS.SCHEDULED,
        notes: "Updated pickup instructions",
      });

      const res = await request(app)
        .put(`/api/commutes/${commuteId}`)
        .set("Authorization", `Bearer ${driverToken}`)
        .send({ notes: "Updated pickup instructions" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notes).toBe("Updated pickup instructions");
    });
  });

  describe("DELETE /api/commutes/:id", () => {
    test("returns 403 when non-owner attempts to cancel", async () => {
      prisma.commute.findUnique.mockResolvedValue({
        id: commuteId,
        driverId,
        status: COMMUTE_STATUS.SCHEDULED,
        bookings: [],
      });

      const res = await request(app)
        .delete(`/api/commutes/${commuteId}`)
        .set("Authorization", `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test("returns 200 when driver cancels own commute", async () => {
      prisma.commute.findUnique.mockResolvedValue({
        id: commuteId,
        driverId,
        status: COMMUTE_STATUS.SCHEDULED,
        bookings: [
          { id: "booking-1", status: BOOKING_STATUS.PENDING },
        ],
      });
      prisma.commute.update.mockResolvedValue({
        id: commuteId,
        driverId,
        status: COMMUTE_STATUS.CANCELLED,
      });
      prisma.booking.updateMany.mockResolvedValue({ count: 1 });

      const res = await request(app)
        .delete(`/api/commutes/${commuteId}`)
        .set("Authorization", `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("cancelled");
    });
  });
});
