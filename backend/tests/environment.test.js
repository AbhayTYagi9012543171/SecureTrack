import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEnvironment } from '../src/config/validateEnv.js';

const valid = {
  NODE_ENV: 'production',
  MONGODB_URI: 'mongodb://localhost:27017/securetrack',
  JWT_SECRET: 'a-unique-random-secret-value-with-more-than-32-characters',
  CLIENT_URL: 'https://securetrack.example.com',
  COOKIE_SECURE: 'true',
  COOKIE_SAME_SITE: 'lax',
};

test('accepts complete production configuration', () => {
  assert.equal(validateEnvironment(valid), true);
});

test('rejects placeholder or short JWT secrets', () => {
  assert.throws(() => validateEnvironment({ ...valid, JWT_SECRET: 'replace-me' }), /JWT_SECRET/);
});

test('requires secure cookies in production', () => {
  assert.throws(() => validateEnvironment({ ...valid, COOKIE_SECURE: 'false' }), /COOKIE_SECURE=true/);
});

test('requires a real frontend origin in production', () => {
  assert.throws(() => validateEnvironment({ ...valid, CLIENT_URL: 'http://localhost:5173' }), /CLIENT_URL/);
});

test('does not impose production-only requirements during local development', () => {
  assert.equal(validateEnvironment({ NODE_ENV: 'development', MONGODB_URI: 'mongodb://localhost/db', JWT_SECRET: 'local-dev-secret-that-is-at-least-32-characters-long' }), true);
});
