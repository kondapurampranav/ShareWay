// tests/unit/auth.service.test.js
// OWNER: Member 1

process.env.JWT_SECRET = 'test_secret_key_12345';

const authService = require('../../src/services/auth.service');
const prisma = require('../../src/config/db');
const { hashPassword } = require('../../src/utils/passwordHash');

jest.mock('../../src/config/db', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  community: {
    findUnique: jest.fn(),
  },
}));

describe('auth.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    test('registers user and hashes password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.community.findUnique.mockResolvedValue({
        id: 'comm-1',
        name: 'DSCE College',
        domain: '@dsce.edu.in',
        isActive: true,
      });

      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        name: 'Test Student',
        email: 'student@dsce.edu.in',
        role: 'MEMBER',
        isActive: true,
        memberships: [
          {
            id: 'mem-1',
            communityId: 'comm-1',
            status: 'APPROVED',
          },
        ],
      });

      const result = await authService.register({
        name: 'Test Student',
        email: 'student@dsce.edu.in',
        password: 'password123',
        communityId: 'comm-1',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'student@dsce.edu.in' },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.token).toBeDefined();
      expect(result.user.name).toBe('Test Student');
      expect(result.user.passwordHash).toBeUndefined();
    });

    test('rejects duplicate email with conflict error', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'existing@dsce.edu.in',
      });

      await expect(
        authService.register({
          name: 'Existing',
          email: 'existing@dsce.edu.in',
          password: 'password123',
        })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    test('rejects mismatched community domain', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.community.findUnique.mockResolvedValue({
        id: 'comm-1',
        name: 'DSCE College',
        domain: '@dsce.edu.in',
        isActive: true,
      });

      await expect(
        authService.register({
          name: 'Wrong Domain',
          email: 'wrong@gmail.com',
          password: 'password123',
          communityId: 'comm-1',
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('login', () => {
    test('login returns JWT on valid credentials', async () => {
      const hashedPassword = await hashPassword('password123');

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        email: 'test@dsce.edu.in',
        passwordHash: hashedPassword,
        role: 'MEMBER',
        isActive: true,
        memberships: [{ communityId: 'comm-1', status: 'APPROVED' }],
      });

      const result = await authService.login({
        email: 'test@dsce.edu.in',
        password: 'password123',
      });

      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('test@dsce.edu.in');
      expect(result.user.passwordHash).toBeUndefined();
    });

    test('login rejects invalid password', async () => {
      const hashedPassword = await hashPassword('password123');

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        email: 'test@dsce.edu.in',
        passwordHash: hashedPassword,
        role: 'MEMBER',
        isActive: true,
      });

      await expect(
        authService.login({
          email: 'test@dsce.edu.in',
          password: 'wrongpassword',
        })
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    test('login rejects inactive account', async () => {
      const hashedPassword = await hashPassword('password123');

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        email: 'test@dsce.edu.in',
        passwordHash: hashedPassword,
        role: 'MEMBER',
        isActive: false,
      });

      await expect(
        authService.login({
          email: 'test@dsce.edu.in',
          password: 'password123',
        })
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });
});
