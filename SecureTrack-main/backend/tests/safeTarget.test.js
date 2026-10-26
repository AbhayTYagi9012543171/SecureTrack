import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTarget } from '../src/services/monitoring/safeTarget.js';

test('rejects localhost', async () => {
  await assert.rejects(() => validateTarget('http://localhost'));
});
test('rejects private IPv4', async () => {
  await assert.rejects(() => validateTarget('http://192.168.1.1'));
  await assert.rejects(() => validateTarget('http://10.0.0.1'));
});
test('rejects IPv4-mapped private IPv6', async () => {
  await assert.rejects(() => validateTarget('http://[::ffff:192.168.1.2]'));
  await assert.rejects(() => validateTarget('http://[::1]'));
});
test('rejects unsupported protocols', async () => {
  await assert.rejects(() => validateTarget('file:///etc/passwd'));
});
test('rejects nonstandard ports', async () => {
  await assert.rejects(() => validateTarget('https://example.com:8443'));
});
test('rejects embedded credentials', async () => {
  await assert.rejects(() => validateTarget('https://user:pass@example.com'));
});
test('rejects local host suffixes', async () => {
  await assert.rejects(() => validateTarget('http://service.internal'));
  await assert.rejects(() => validateTarget('http://machine.local'));
});
