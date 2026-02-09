const { hashPassword, comparePassword, validatePasswordStrength } = require('../../src/utils/password');

describe('Password Utils', () => {
  test('hashPassword should hash password', async () => {
    const password = 'SecurePass123';
    const hash = await hashPassword(password);
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
  });

  test('comparePassword should match correct password', async () => {
    const password = 'SecurePass123';
    const hash = await hashPassword(password);
    const match = await comparePassword(password, hash);
    expect(match).toBe(true);
  });

  test('comparePassword should not match wrong password', async () => {
    const password = 'SecurePass123';
    const wrongPassword = 'WrongPass123';
    const hash = await hashPassword(password);
    const match = await comparePassword(wrongPassword, hash);
    expect(match).toBe(false);
  });

  test('validatePasswordStrength should require 8+ characters', () => {
    const result = validatePasswordStrength('Pass1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least 8 characters');
  });

  test('validatePasswordStrength should require uppercase, lowercase, number', () => {
    const result = validatePasswordStrength('lowercase1234');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Uppercase letter');
  });

  test('validatePasswordStrength should accept strong password', () => {
    const result = validatePasswordStrength('SecurePass123');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('hashPassword should throw error for short password', async () => {
    await expect(hashPassword('short')).rejects.toThrow('Password must be at least 8 characters');
  });
});
