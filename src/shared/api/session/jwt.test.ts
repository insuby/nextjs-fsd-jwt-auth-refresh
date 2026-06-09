import { expect, test } from 'vitest';

import { decodeJwtExp, isExpiredOrNear } from './jwt';

function makeJwt(payload: object): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

const NOW = 1_700_000_000_000; // fixed "now" in ms

test('decodeJwtExp reads the exp claim', () => {
  expect(decodeJwtExp(makeJwt({ exp: 1700000000, sub: 'emilys' }))).toBe(
    1700000000,
  );
});

test('decodeJwtExp returns null for an unreadable token', () => {
  expect(decodeJwtExp('not-a-jwt')).toBeNull();
  expect(decodeJwtExp(makeJwt({ noExp: true }))).toBeNull();
});

test('isExpiredOrNear: a token far in the future is not near', () => {
  const token = makeJwt({ exp: NOW / 1000 + 3600 }); // +1h
  expect(isExpiredOrNear(token, 30, NOW)).toBe(false);
});

test('isExpiredOrNear: a token within the skew window is near', () => {
  const token = makeJwt({ exp: NOW / 1000 + 20 }); // +20s, skew 30
  expect(isExpiredOrNear(token, 30, NOW)).toBe(true);
});

test('isExpiredOrNear: an expired token is near', () => {
  const token = makeJwt({ exp: NOW / 1000 - 10 });
  expect(isExpiredOrNear(token, 30, NOW)).toBe(true);
});

test('isExpiredOrNear: an undecodable token is treated as needing refresh', () => {
  expect(isExpiredOrNear('garbage', 30, NOW)).toBe(true);
});
