const bcrypt = require("bcryptjs");

// bcrypt stores a salted hash so plaintext passwords are never saved.
const SALT_ROUNDS = 10;

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

module.exports = {
  hashPassword,
  comparePassword,
};
