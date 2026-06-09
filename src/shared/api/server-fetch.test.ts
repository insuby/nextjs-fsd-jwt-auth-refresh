// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';

import { SessionExpiredError } from './errors';
import { serverFetch } from './server-fetch';
import { readTokens, setTokens } from './session/cookies';
import {
  getRefreshedTokens,
  refreshOnce,
} from './session/refresh-single-flight';

vi.mock('./session/cookies', () => ({
  readTokens: vi.fn(),
  setTokens: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('./session/refresh-single-flight', () => ({
  refreshOnce: vi.fn(),
  getRefreshedTokens: vi.fn(() => null),
}));

const mockReadTokens = vi.mocked(readTokens);
const mockRefreshOnce = vi.mocked(refreshOnce);
const mockGetRefreshedTokens = vi.mocked(getRefreshedTokens);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function authHeaderOf(fetchMock: ReturnType<typeof vi.fn>, callIndex: number) {
  return (fetchMock.mock.calls[callIndex][1].headers as Headers).get(
    'Authorization',
  );
}

test('attaches the bearer and returns data when the access token is valid', async () => {
  mockReadTokens.mockResolvedValue({ accessToken: 'good', refreshToken: 'r' });
  const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 1 }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(serverFetch('/auth/me')).resolves.toEqual({ id: 1 });
  expect(mockRefreshOnce).not.toHaveBeenCalled();
  expect(authHeaderOf(fetchMock, 0)).toBe('Bearer good');
});

test('on 401 it refreshes once and transparently retries with the new token', async () => {
  mockReadTokens.mockResolvedValue({ accessToken: 'stale', refreshToken: 'r' });
  mockRefreshOnce.mockResolvedValue({
    accessToken: 'fresh',
    refreshToken: 'r2',
  });
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(jsonResponse({ message: 'expired' }, 401))
    .mockResolvedValueOnce(jsonResponse({ id: 1 }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(serverFetch('/auth/me')).resolves.toEqual({ id: 1 });
  expect(mockRefreshOnce).toHaveBeenCalledTimes(1);
  expect(setTokens).toHaveBeenCalledWith({
    accessToken: 'fresh',
    refreshToken: 'r2',
  });
  expect(authHeaderOf(fetchMock, 1)).toBe('Bearer fresh');
});

test('401 with no refresh token → SessionExpiredError, no refresh attempted', async () => {
  mockReadTokens.mockResolvedValue({
    accessToken: 'stale',
    refreshToken: undefined,
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 401)));

  await expect(serverFetch('/auth/me')).rejects.toBeInstanceOf(
    SessionExpiredError,
  );
  expect(mockRefreshOnce).not.toHaveBeenCalled();
});

test('a failed refresh → SessionExpiredError', async () => {
  mockReadTokens.mockResolvedValue({ accessToken: 'stale', refreshToken: 'r' });
  mockRefreshOnce.mockRejectedValue(new Error('refresh boom'));
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 401)));

  await expect(serverFetch('/auth/me')).rejects.toBeInstanceOf(
    SessionExpiredError,
  );
});

test('still 401 after refresh → SessionExpiredError', async () => {
  mockReadTokens.mockResolvedValue({ accessToken: 'stale', refreshToken: 'r' });
  mockRefreshOnce.mockResolvedValue({
    accessToken: 'fresh',
    refreshToken: 'r2',
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 401)));

  await expect(serverFetch('/auth/me')).rejects.toBeInstanceOf(
    SessionExpiredError,
  );
});

test('a non-401 error is propagated as-is and never refreshed', async () => {
  mockReadTokens.mockResolvedValue({ accessToken: 'good', refreshToken: 'r' });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 500)));

  await expect(serverFetch('/auth/me')).rejects.toMatchObject({
    name: 'ApiError',
    status: 500,
  });
  expect(mockRefreshOnce).not.toHaveBeenCalled();
});

test('reuses tokens already refreshed earlier in the same request (one refresh per request)', async () => {
  mockReadTokens.mockResolvedValue({ accessToken: 'stale', refreshToken: 'r' });
  mockGetRefreshedTokens.mockReturnValueOnce({
    accessToken: 'already-fresh',
    refreshToken: 'r2',
  });
  const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 1 }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(serverFetch('/auth/me')).resolves.toEqual({ id: 1 });
  // Used the already-refreshed token on the first try → no 401, no extra refresh.
  expect(authHeaderOf(fetchMock, 0)).toBe('Bearer already-fresh');
  expect(mockRefreshOnce).not.toHaveBeenCalled();
});
