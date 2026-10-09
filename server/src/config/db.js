// server/src/config/db.js
// Prisma client singleton — import this wherever you need DB access.
// OWNER: Member 1

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

module.exports = prisma;
