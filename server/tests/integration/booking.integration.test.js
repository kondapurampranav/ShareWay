// tests/integration/booking.integration.test.js
// OWNER: Member 3

process.env.JWT_SECRET = "test-jwt-secret-key-for-testing";

const express = require("express");
const request = require("supertest");
const commuteRoutes = require("../../src/routes/commute.routes");
const bookingRoutes = require("../../src/routes/booking.routes");
const errorHandler = require("../../src/middleware/errorHandler");
const prisma = require("../../src/config/db");
const { signToken } = require("../../src/utils/jwt");
const { COMMUTE_STATUS, BOOKING_STATUS } = require("../../src/config/constants");

const app = express();
app.use(express.json());
app.use("/api/commutes", commuteRoutes);
app.use("/api/bookings", bookingRoutes);
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
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn((promises) => Promise.all(promises)),
}));

describe("Commute Discovery & Booking API", () => {
  const passengerId = "c3b2e1a0-4f5a-4b6c-8d7e-9f0a1b2c3d4e";
  const driverId = "d4c3b2a1-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
  const otherUserId = "e5d4c3b2-6a7b-4c8d-9e0f-1a2b3c4d5e6f";
  const commuteId = "f6e5d4c3-7b8c-4d9e-af10-2b3c4d5e6f70";
  const bookingId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

  let passengerToken;
  let driverToken;
  let otherUserToken;

  beforeAll(() => {
    passengerToken = signToken({ userId: passengerId, role: "MEMBER" });
    driverToken = signToken({ userId: driverId, role: "MEMBER" });
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

  describe("GET /api/commutes/search — Commute Discovery", () => {
    test("returns matching available scheduled commutes", async () => {
      const mockCommutes = [
        {
          id: commuteId,
          driverId,
          origin: "Campus Gate 1",
          destination: "Metro Station",
          departureTime: new Date(Date.now() + 86400000),
          availableSeats: 3,
          status: COMMUTE_STATUS.SCHEDULED,
          driver: { id: driverId, name: "Rahul", email: "rahul@test.com" },
        },
      ];
      prisma.commute.findMany.mockResolvedValue(mockCommutes);

      const res = await request(app)
        .get("/api/commutes/search?origin=Campus&destination=Metro")
        .set("Authorization", `Bearer ${passengerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].origin).toBe("Campus Gate 1");
    });
  });

  describe("POST /api/commutes/:id/bookings — Request Seats", () => {
    test("passenger can request a seat", async () => {
      const mockCommute = {
        id: commuteId,
        driverId,
        status: COMMUTE_STATUS.SCHEDULED,
        departureTime: new Date(Date.now() + 86400000),
        availableSeats: 2,
        contributionPerSeat: 40.0,
      };
      prisma.commute.findUnique.mockResolvedValue(mockCommute);
      prisma.booking.findFirst.mockResolvedValue(null);

      const createdBooking = {
        id: bookingId,
        commuteId,
        passengerId,
        driverId,
        seatsBooked: 1,
        agreedContribution: 40.0,
        status: BOOKING_STATUS.PENDING,
      };
      prisma.booking.create.mockResolvedValue(createdBooking);

      const res = await request(app)
        .post(`/api/commutes/${commuteId}/bookings`)
        .set("Authorization", `Bearer ${passengerToken}`)
        .send({ seatsBooked: 1 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(BOOKING_STATUS.PENDING);
      expect(res.body.data.seatsBooked).toBe(1);
    });

    test("driver cannot request seat on own commute", async () => {
      const mockCommute = {
        id: commuteId,
        driverId,
        status: COMMUTE_STATUS.SCHEDULED,
        departureTime: new Date(Date.now() + 86400000),
        availableSeats: 2,
      };
      prisma.commute.findUnique.mockResolvedValue(mockCommute);

      const res = await request(app)
        .post(`/api/commutes/${commuteId}/bookings`)
        .set("Authorization", `Bearer ${driverToken}`)
        .send({ seatsBooked: 1 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Drivers cannot book their own commute");
    });
  });

  describe("GET /api/bookings — Track Booking Status", () => {
    test("passenger can view their own bookings", async () => {
      const mockBookings = [
        {
          id: bookingId,
          commuteId,
          passengerId,
          driverId,
          status: BOOKING_STATUS.PENDING,
        },
      ];
      prisma.booking.findMany.mockResolvedValue(mockBookings);

      const res = await request(app)
        .get("/api/bookings")
        .set("Authorization", `Bearer ${passengerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("PATCH /api/bookings/:id/status — Status Transitions", () => {
    test("driver can accept booking request", async () => {
      const mockBooking = {
        id: bookingId,
        commuteId,
        driverId,
        passengerId,
        seatsBooked: 1,
        status: BOOKING_STATUS.PENDING,
      };
      const mockCommute = {
        id: commuteId,
        availableSeats: 2,
      };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.commute.findUnique.mockResolvedValue(mockCommute);
      prisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BOOKING_STATUS.ACCEPTED,
      });
      prisma.commute.update.mockResolvedValue({
        ...mockCommute,
        availableSeats: 1,
      });

      const res = await request(app)
        .patch(`/api/bookings/${bookingId}/status`)
        .set("Authorization", `Bearer ${driverToken}`)
        .send({ status: BOOKING_STATUS.ACCEPTED });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(BOOKING_STATUS.ACCEPTED);
    });

    test("non-driver cannot accept booking request (403 Forbidden)", async () => {
      const mockBooking = {
        id: bookingId,
        commuteId,
        driverId,
        passengerId,
        seatsBooked: 1,
        status: BOOKING_STATUS.PENDING,
      };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      const res = await request(app)
        .patch(`/api/bookings/${bookingId}/status`)
        .set("Authorization", `Bearer ${otherUserToken}`)
        .send({ status: BOOKING_STATUS.ACCEPTED });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test("passenger can cancel their own booking", async () => {
      const mockBooking = {
        id: bookingId,
        commuteId,
        driverId,
        passengerId,
        seatsBooked: 1,
        status: BOOKING_STATUS.PENDING,
      };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BOOKING_STATUS.CANCELLED,
      });

      const res = await request(app)
        .patch(`/api/bookings/${bookingId}/status`)
        .set("Authorization", `Bearer ${passengerToken}`)
        .send({ status: BOOKING_STATUS.CANCELLED });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(BOOKING_STATUS.CANCELLED);
    });
  });
});
