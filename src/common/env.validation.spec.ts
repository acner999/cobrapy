import { describe, it, expect } from 'vitest';
import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const baseEnv = {
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    JWT_SECRET: 'a-very-long-secret-key',
    ADMIN_TOKEN: 'admintok123',
  };

  it('accepts a valid env', () => {
    const env = validateEnv({ ...baseEnv, NODE_ENV: 'development', PORT: '3000' });
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.REDIS_HOST).toBe('localhost'); // default
  });

  it('coerces PORT from string to number', () => {
    const env = validateEnv({ ...baseEnv, PORT: '8080' });
    expect(env.PORT).toBe(8080);
  });

  it('rejects when DATABASE_URL is missing', () => {
    const incomplete = { ...baseEnv };
    delete (incomplete as Partial<typeof baseEnv>).DATABASE_URL;
    expect(() => validateEnv(incomplete)).toThrow(/DATABASE_URL/);
  });

  it('rejects short JWT_SECRET', () => {
    expect(() => validateEnv({ ...baseEnv, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });

  it('rejects invalid NODE_ENV values', () => {
    expect(() => validateEnv({ ...baseEnv, NODE_ENV: 'staging' })).toThrow();
  });
});
