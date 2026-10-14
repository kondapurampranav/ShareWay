// tests/unit/booking.service.test.js
// OWNER: Member 3
// Tests seat allocation, overbooking prevention, and state transitions.

const bookingService = require("../../src/services/booking.service");
const prisma = require("../../src/config/db");
const ApiError = require("../../src/utils/ApiError");
const { COMMUTE_STATUS, BOOKING_STATUS } = require("../../src/config/constants");

jest.mock("../../src/config/db", () => ({
  commute: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  booking: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((promises) => Promise.all(promises)),
}));

describe("booking.service", () => {
  const mockPassengerId = "passenger-uuid-111";
  const mockDriverId = "driver-uuid-222";
  const mockOtherUserId = "other-uuid-333";
  const mockCommuteId = "commute-uuid-444";
  const mockBookingId = "booking-uuid-555";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createBooking", () => {
    test("creates booking with status PENDING on happy path", async () => {
      const mockCommute = {
        id: mockCommuteId,
        driverId: mockDriverId,
        status: COMMUTE_STATUS.SCHEDULED,
        departureTime: new Date(Date.now() + 86400000),
        availableSeats: 3,
        contributionPerSeat: 50.0,
      };

      prisma.commute.findUnique.mockResolvedValue(mockCommute);
      prisma.booking.findFirst.mockResolvedValue(null);

      const createdBooking = {
        id: mockBookingId,
        commuteId: mockCommuteId,
        passengerId: mockPassengerId,
        driverId: mockDriverId,
        seatsBooked: 2,
        agreedContribution: 50.0,
        status: BOOKING_STATUS.PENDING,
      };
      prisma.booking.create.mockResolvedValue(createdBooking);

      const result = await bookingService.createBooking(mockPassengerId, {
        commuteId: mockCommuteId,
        seatsBooked: 2,
      });

      expect(prisma.commute.findUnique).toHaveBeenCalledWith({ where: { id: mockCommuteId } });
      expect(prisma.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            commuteId: mockCommuteId,
            passengerId: mockPassengerId,
            driverId: mockDriverId,
            seatsBooked: 2,
            status: BOOKING_STATUS.PENDING,
          }),
        })
      );
      expect(result.status).toBe(BOOKING_STATUS.PENDING);
    });

    test("prevents overbooking when requested seats exceed available seats", async () => {
      const mockCommute = {
        id: mockCommuteId,
        driverId: mockDriverId,
        status: COMMUTE_STATUS.SCHEDULED,
        departureTime: new Date(Date.now() + 86400000),
        availableSeats: 1,
      };

      prisma.commute.findUnique.mockResolvedValue(mockCommute);

      await expect(
        bookingService.createBooking(mockPassengerId, {
          commuteId: mockCommuteId,
          seatsBooked: 2,
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining("Not enough available seats"),
      });
    });

    test("rejects driver booking their own commute", async () => {
      const mockCommute = {
        id: mockCommuteId,
        driverId: mockDriverId,
        status: COMMUTE_STATUS.SCHEDULED,
        departureTime: new Date(Date.now() + 86400000),
        availableSeats: 3,
      };

      prisma.commute.findUnique.mockResolvedValue(mockCommute);

      await expect(
        bookingService.createBooking(mockDriverId, {
          commuteId: mockCommuteId,
          seatsBooked: 1,
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Drivers cannot book their own commute",
      });
    });

    test("rejects booking if passenger already has active booking", async () => {
      const mockCommute = {
        id: mockCommuteId,
        driverId: mockDriverId,
        status: COMMUTE_STATUS.SCHEDULED,
        departureTime: new Date(Date.now() + 86400000),
        availableSeats: 3,
      };

      prisma.commute.findUnique.mockResolvedValue(mockCommute);
      prisma.booking.findFirst.mockResolvedValue({ id: "existing-booking-id" });

      await expect(
        bookingService.createBooking(mockPassengerId, {
          commuteId: mockCommuteId,
          seatsBooked: 1,
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "You already have an active booking for this commute",
      });
    });
  });

  describe("updateBookingStatus", () => {
    test("driver accepts booking: availableSeats decrements on booking acceptance", async () => {
      const mockBooking = {
        id: mockBookingId,
        commuteId: mockCommuteId,
        driverId: mockDriverId,
        passengerId: mockPassengerId,
        seatsBooked: 1,
        status: BOOKING_STATUS.PENDING,
      };
      const mockCommute = {
        id: mockCommuteId,
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

      const result = await bookingService.updateBookingStatus(
        mockBookingId,
        mockDriverId,
        BOOKING_STATUS.ACCEPTED
      );

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.commute.update).toHaveBeenCalledWith({
        where: { id: mockCommuteId },
        data: { availableSeats: { decrement: 1 } },
      });
      expect(result.status).toBe(BOOKING_STATUS.ACCEPTED);
    });

    test("driver rejects booking when status is PENDING", async () => {
      const mockBooking = {
        id: mockBookingId,
        commuteId: mockCommuteId,
        driverId: mockDriverId,
        passengerId: mockPassengerId,
        status: BOOKING_STATUS.PENDING,
      };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BOOKING_STATUS.REJECTED,
      });

      const result = await bookingService.updateBookingStatus(
        mockBookingId,
        mockDriverId,
        BOOKING_STATUS.REJECTED
      );

      expect(result.status).toBe(BOOKING_STATUS.REJECTED);
    });

    test("availableSeats increments on accepted booking cancellation", async () => {
      const mockBooking = {
        id: mockBookingId,
        commuteId: mockCommuteId,
        driverId: mockDriverId,
        passengerId: mockPassengerId,
        seatsBooked: 2,
        status: BOOKING_STATUS.ACCEPTED,
      };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BOOKING_STATUS.CANCELLED,
      });
      prisma.commute.update.mockResolvedValue({
        id: mockCommuteId,
        availableSeats: 4,
      });

      const result = await bookingService.updateBookingStatus(
        mockBookingId,
        mockPassengerId,
        BOOKING_STATUS.CANCELLED
      );

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.commute.update).toHaveBeenCalledWith({
        where: { id: mockCommuteId },
        data: { availableSeats: { increment: 2 } },
      });
      expect(result.status).toBe(BOOKING_STATUS.CANCELLED);
    });

    test("rejects invalid booking status transition", async () => {
      const mockBooking = {
        id: mockBookingId,
        commuteId: mockCommuteId,
        driverId: mockDriverId,
        passengerId: mockPassengerId,
        status: BOOKING_STATUS.CANCELLED,
      };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        bookingService.updateBookingStatus(mockBookingId, mockDriverId, BOOKING_STATUS.ACCEPTED)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining("Only PENDING bookings can be accepted"),
      });
    });

    test("throws 403 when non-driver tries to accept booking", async () => {
      const mockBooking = {
        id: mockBookingId,
        driverId: mockDriverId,
        passengerId: mockPassengerId,
        status: BOOKING_STATUS.PENDING,
      };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        bookingService.updateBookingStatus(mockBookingId, mockOtherUserId, BOOKING_STATUS.ACCEPTED)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: "Only the driver can accept booking requests",
      });
    });
  });

  describe("completeBooking", () => {
    test("marks an accepted booking as completed", async () => {
      const mockBooking = {
        id: mockBookingId,
        driverId: mockDriverId,
        passengerId: mockPassengerId,
        status: BOOKING_STATUS.ACCEPTED,
      };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BOOKING_STATUS.COMPLETED,
      });

      const result = await bookingService.completeBooking(mockBookingId, mockDriverId);

      expect(result.status).toBe(BOOKING_STATUS.COMPLETED);
    });
  });
});
