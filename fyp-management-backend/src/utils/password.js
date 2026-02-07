const bcrypt = require('bcryptjs');

const ROUNDS = 10;

const hashPassword = async (password) => {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  return bcrypt.hash(password, ROUNDS);
};

const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const validatePasswordStrength = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Number');
  return { valid: errors.length === 0, errors };
};

module.exports = { hashPassword, comparePassword, validatePasswordStrength };
