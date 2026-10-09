// server/prisma/seed.js
// Seed file for development data.
// Run with: node prisma/seed.js  OR  npx prisma db seed

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Community ──────────────────────────────────────────────────────────────
  const community = await prisma.community.upsert({
    where: { name: 'DSCE College' },
    update: {},
    create: {
      name: 'DSCE College',
      description: 'Dayananda Sagar College of Engineering',
      domain: '@dsce.edu.in',
    },
  });

  // ── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12);

  const driver = await prisma.user.upsert({
    where: { email: 'rahul@dsce.edu.in' },
    update: {},
    create: {
      name: 'Rahul Kumar',
      email: 'rahul@dsce.edu.in',
      passwordHash,
      role: 'MEMBER',
    },
  });

  const passenger = await prisma.user.upsert({
    where: { email: 'priya@dsce.edu.in' },
    update: {},
    create: {
      name: 'Priya Sharma',
      email: 'priya@dsce.edu.in',
      passwordHash,
      role: 'MEMBER',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@dsce.edu.in' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@dsce.edu.in',
      passwordHash,
      role: 'COMMUNITY_ADMIN',
    },
  });

  // ── Memberships ────────────────────────────────────────────────────────────
  for (const userId of [driver.id, passenger.id, admin.id]) {
    await prisma.membership.upsert({
      where: { userId_communityId: { userId, communityId: community.id } },
      update: {},
      create: { userId, communityId: community.id, status: 'APPROVED', joinedAt: new Date() },
    });
  }

  // ── Sample Commute ─────────────────────────────────────────────────────────
  await prisma.commute.create({
    data: {
      driverId: driver.id,
      origin: 'Kumaraswamy Layout',
      destination: 'DSCE',
      departureTime: new Date('2026-10-10T08:30:00'),
      vehicleType: 'BIKE',
      totalSeats: 1,
      availableSeats: 1,
      contributionPerSeat: 50,
      status: 'SCHEDULED',
    },
  });

  console.log('✅ Seeding complete.');
  console.log('   Community:', community.name);
  console.log('   Users: rahul@dsce.edu.in, priya@dsce.edu.in, admin@dsce.edu.in');
  console.log('   Password for all: password123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
