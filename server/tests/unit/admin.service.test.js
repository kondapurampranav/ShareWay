// tests/unit/admin.service.test.js
// OWNER: Member 1

const adminService = require('../../src/services/admin.service');
const prisma = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  membership: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  commute: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  booking: {
    count: jest.fn(),
  },
  report: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    update: jest.fn(),
  },
}));

describe('admin.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('stats', () => {
    test('returns aggregate metrics and recent members', async () => {
      prisma.membership.findFirst.mockResolvedValue({ communityId: 'comm-1' });
      prisma.membership.count.mockResolvedValue(10);
      prisma.commute.count.mockResolvedValue(5);
      prisma.booking.count.mockResolvedValue(8);
      prisma.report.count.mockResolvedValue(1);
      prisma.membership.findMany.mockResolvedValue([]);

      const adminUser = { id: 'admin-1', role: 'COMMUNITY_ADMIN' };
      const stats = await adminService.stats(adminUser);

      expect(stats.totalMembers).toBe(10);
      expect(stats.totalCommutes).toBe(5);
      expect(stats.totalBookings).toBe(8);
      expect(stats.openReports).toBe(1);
    });
  });

  describe('updateMember', () => {
    test('approves member status', async () => {
      prisma.membership.findUnique.mockResolvedValue({
        id: 'mem-1',
        userId: 'user-1',
        status: 'PENDING',
        joinedAt: null,
      });

      prisma.membership.update.mockResolvedValue({
        id: 'mem-1',
        status: 'APPROVED',
        joinedAt: new Date(),
        user: { id: 'user-1', name: 'John Doe', email: 'john@dsce.edu.in' },
        community: { id: 'comm-1', name: 'DSCE' },
      });

      const adminUser = { id: 'admin-1', role: 'COMMUNITY_ADMIN' };
      const result = await adminService.updateMember(adminUser, 'mem-1', {
        status: 'APPROVED',
      });

      expect(result.status).toBe('APPROVED');
      expect(prisma.membership.update).toHaveBeenCalled();
    });

    test('rejects invalid status', async () => {
      prisma.membership.findUnique.mockResolvedValue({
        id: 'mem-1',
        userId: 'user-1',
      });

      const adminUser = { id: 'admin-1', role: 'COMMUNITY_ADMIN' };
      await expect(
        adminService.updateMember(adminUser, 'mem-1', { status: 'INVALID_STATUS' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('updateReport', () => {
    test('updates report to RESOLVED with notes', async () => {
      prisma.report.findUnique.mockResolvedValue({
        id: 'rep-1',
        status: 'OPEN',
      });

      prisma.report.update.mockResolvedValue({
        id: 'rep-1',
        status: 'RESOLVED',
        adminNotes: 'Resolved with warning',
        reporter: { id: 'u1' },
        reported: { id: 'u2' },
      });

      const adminUser = { id: 'admin-1', role: 'COMMUNITY_ADMIN' };
      const updated = await adminService.updateReport(adminUser, 'rep-1', {
        status: 'RESOLVED',
        adminNotes: 'Resolved with warning',
      });

      expect(updated.status).toBe('RESOLVED');
      expect(prisma.report.update).toHaveBeenCalled();
    });
  });
});
