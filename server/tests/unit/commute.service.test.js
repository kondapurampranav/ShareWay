// tests/unit/commute.service.test.js
// OWNER: Member 2

const commuteService = require("../../src/services/commute.service");
const prisma = require("../../src/config/db");
const ApiError = require("../../src/utils/ApiError");
const { COMMUTE_STATUS, BOOKING_STATUS } = require("../../src/config/constants");

jest.mock("../../src/config/db", () => ({
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

describe("commute.service", () => {
  const mockDriverId = "driver-uuid-123";
  const mockOtherUserId = "other-user-uuid-456";
  const mockCommuteId = "commute-uuid-789";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createCommute", () => {
    test("creates a commute with availableSeats equal to totalSeats and status SCHEDULED", async () => {
      const input = {
        origin: "Campus North",
        destination: "City Center",
        departureTime: "2026-10-15T09:00:00.000Z",
        vehicleType: "CAR",
        totalSeats: 3,
        contributionPerSeat: 60.0,
        notes: "Pickup at main gate",
      };

      const createdRecord = {
        id: mockCommuteId,
        driverId: mockDriverId,
        ...input,
        departureTime: new Date(input.departureTime),
        availableSeats: 3,
        status: COMMUTE_STATUS.SCHEDULED,
        recurringScheduleId: null,
      };

      prisma.commute.create.mockResolvedValue(createdRecord);

      const result = await commuteService.createCommute(mockDriverId, input);

      expect(prisma.commute.create).toHaveBeenCalledWith({
        data: {
          driverId: mockDriverId,
          origin: input.origin,
          destination: input.destination,
          departureTime: new Date(input.departureTime),
          vehicleType: input.vehicleType,
          totalSeats: 3,
          availableSeats: 3,
          contributionPerSeat: 60.0,
          status: COMMUTE_STATUS.SCHEDULED,
          notes: input.notes,
          recurringScheduleId: null,
        },
      });
      expect(result.availableSeats).toBe(3);
      expect(result.status).toBe(COMMUTE_STATUS.SCHEDULED);
      expect(result.driverId).toBe(mockDriverId);
    });
  });

  describe("getDriverCommutes", () => {
    test("retrieves all commutes for the given driver", async () => {
      const mockList = [
        { id: "1", driverId: mockDriverId, origin: "A", destination: "B" },
        { id: "2", driverId: mockDriverId, origin: "C", destination: "D" },
      ];
      prisma.commute.findMany.mockResolvedValue(mockList);

      const result = await commuteService.getDriverCommutes(mockDriverId);

      expect(prisma.commute.findMany).toHaveBeenCalledWith({
        where: { driverId: mockDriverId },
        orderBy: { departureTime: "asc" },
        include: {
          bookings: {
            select: {
              id: true,
              passengerId: true,
              status: true,
              seatsBooked: true,
              agreedContribution: true,
            },
          },
        },
      });
      expect(result).toHaveLength(2);
    });

    test("filters by status if status filter is provided", async () => {
      prisma.commute.findMany.mockResolvedValue([]);

      await commuteService.getDriverCommutes(mockDriverId, { status: COMMUTE_STATUS.SCHEDULED });

      expect(prisma.commute.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            driverId: mockDriverId,
            status: COMMUTE_STATUS.SCHEDULED,
          },
        })
      );
    });
  });

  describe("getCommuteById", () => {
    test("returns commute if found", async () => {
      const mockRecord = {
        id: mockCommuteId,
        driverId: mockDriverId,
        origin: "Origin",
        destination: "Destination",
      };
      prisma.commute.findUnique.mockResolvedValue(mockRecord);

      const result = await commuteService.getCommuteById(mockCommuteId);

      expect(result).toEqual(mockRecord);
    });

    test("throws 404 ApiError if commute does not exist", async () => {
      prisma.commute.findUnique.mockResolvedValue(null);

      await expect(commuteService.getCommuteById("non-existent")).rejects.toThrow(ApiError);
      await expect(commuteService.getCommuteById("non-existent")).rejects.toMatchObject({
        statusCode: 404,
        message: "Commute not found",
      });
    });
  });

  describe("updateCommute", () => {
    test("updates driver's own commute successfully", async () => {
      const existingCommute = {
        id: mockCommuteId,
        driverId: mockDriverId,
        status: COMMUTE_STATUS.SCHEDULED,
        totalSeats: 3,
        availableSeats: 3,
        bookings: [],
      };
      prisma.commute.findUnique.mockResolvedValue(existingCommute);
      prisma.commute.update.mockResolvedValue({
        ...existingCommute,
        notes: "Updated note",
      });

      const result = await commuteService.updateCommute(mockCommuteId, mockDriverId, {
        notes: "Updated note",
      });

      expect(prisma.commute.update).toHaveBeenCalledWith({
        where: { id: mockCommuteId },
        data: { notes: "Updated note" },
      });
      expect(result.notes).toBe("Updated note");
    });

    test("throws 403 Forbidden when a different driver attempts update", async () => {
      const existingCommute = {
        id: mockCommuteId,
        driverId: mockDriverId,
        status: COMMUTE_STATUS.SCHEDULED,
        bookings: [],
      };
      prisma.commute.findUnique.mockResolvedValue(existingCommute);

      await expect(
        commuteService.updateCommute(mockCommuteId, mockOtherUserId, { notes: "Hacked" })
      ).rejects.toMatchObject({
        statusCode: 403,
        message: "You are not authorized to modify this commute",
      });
    });

    test("cannot update a COMPLETED or CANCELLED commute", async () => {
      prisma.commute.findUnique.mockResolvedValue({
        id: mockCommuteId,
        driverId: mockDriverId,
        status: COMMUTE_STATUS.COMPLETED,
        bookings: [],
      });

      await expect(
        commuteService.updateCommute(mockCommuteId, mockDriverId, { notes: "Test" })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Cannot modify a completed commute",
      });

      prisma.commute.findUnique.mockResolvedValue({
        id: mockCommuteId,
        driverId: mockDriverId,
        status: COMMUTE_STATUS.CANCELLED,
        bookings: [],
      });

      await expect(
        commuteService.updateCommute(mockCommuteId, mockDriverId, { notes: "Test" })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Cannot modify a cancelled commute",
      });
    });

    test("cannot reduce totalSeats below accepted booked seats", async () => {
      const existingCommute = {
        id: mockCommuteId,
        driverId: mockDriverId,
        status: COMMUTE_STATUS.SCHEDULED,
        totalSeats: 3,
        availableSeats: 1,
        bookings: [
          { status: BOOKING_STATUS.ACCEPTED, seatsBooked: 2 },
        ],
      };
      prisma.commute.findUnique.mockResolvedValue(existingCommute);

      await expect(
        commuteService.updateCommute(mockCommuteId, mockDriverId, { totalSeats: 1 })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining("cannot be less than already booked seats"),
      });
    });

    test("recalculates availableSeats when totalSeats is updated", async () => {
      const existingCommute = {
        id: mockCommuteId,
        driverId: mockDriverId,
        status: COMMUTE_STATUS.SCHEDULED,
        totalSeats: 3,
        availableSeats: 1,
        bookings: [
          { status: BOOKING_STATUS.ACCEPTED, seatsBooked: 2 },
        ],
      };
      prisma.commute.findUnique.mockResolvedValue(existingCommute);
      prisma.commute.update.mockResolvedValue({
        ...existingCommute,
        totalSeats: 4,
        availableSeats: 2,
      });

      const updated = await commuteService.updateCommute(mockCommuteId, mockDriverId, { totalSeats: 4 });

      expect(prisma.commute.update).toHaveBeenCalledWith({
        where: { id: mockCommuteId },
        data: {
          totalSeats: 4,
          availableSeats: 2,
        },
      });
      expect(updated.availableSeats).toBe(2);
    });
  });

  describe("cancelCommute", () => {
    test("cancels driver's own commute and cancels active bookings", async () => {
      const existingCommute = {
        id: mockCommuteId,
        driverId: mockDriverId,
        status: COMMUTE_STATUS.SCHEDULED,
        bookings: [
          { id: "booking-1", status: BOOKING_STATUS.ACCEPTED },
          { id: "booking-2", status: BOOKING_STATUS.PENDING },
        ],
      };
      prisma.commute.findUnique.mockResolvedValue(existingCommute);
      prisma.commute.update.mockReturnValue(
        Promise.resolve({ ...existingCommute, status: COMMUTE_STATUS.CANCELLED })
      );
      prisma.booking.updateMany.mockReturnValue(
        Promise.resolve({ count: 2 })
      );

      const result = await commuteService.cancelCommute(mockCommuteId, mockDriverId);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.status).toBe(COMMUTE_STATUS.CANCELLED);
    });

    test("cannot cancel an already COMPLETED commute", async () => {
      prisma.commute.findUnique.mockResolvedValue({
        id: mockCommuteId,
        driverId: mockDriverId,
        status: COMMUTE_STATUS.COMPLETED,
        bookings: [],
      });

      await expect(
        commuteService.cancelCommute(mockCommuteId, mockDriverId)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Cannot cancel a completed commute",
      });
    });

    test("cannot cancel an already CANCELLED commute", async () => {
      prisma.commute.findUnique.mockResolvedValue({
        id: mockCommuteId,
        driverId: mockDriverId,
        status: COMMUTE_STATUS.CANCELLED,
        bookings: [],
      });

      await expect(
        commuteService.cancelCommute(mockCommuteId, mockDriverId)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Commute is already cancelled",
      });
    });

    test("throws 403 if non-owner attempts to cancel", async () => {
      prisma.commute.findUnique.mockResolvedValue({
        id: mockCommuteId,
        driverId: mockDriverId,
        status: COMMUTE_STATUS.SCHEDULED,
        bookings: [],
      });

      await expect(
        commuteService.cancelCommute(mockCommuteId, mockOtherUserId)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: "You are not authorized to cancel this commute",
      });
    });
  });
});
