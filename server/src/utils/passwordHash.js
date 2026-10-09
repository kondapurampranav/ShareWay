// server/src/utils/passwordHash.js
// bcrypt helpers for hashing and comparing passwords.
// OWNER: Member 1

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = { hashPassword, comparePassword };
