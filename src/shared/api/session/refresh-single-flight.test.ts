import { expect, test, vi } from 'vitest';

import { type RefreshState, runSingleFlight } from './refresh-single-flight';

const TOKENS = { accessToken: 'a', refreshToken: 'r' };

function freshState(): RefreshState {
  return { inflight: null, tokens: null };
}

test('single refresh: concurrent callers in one request share ONE refresh', async () => {
  const state = freshState();
  const refresh = vi.fn(
    () =>
      new Promise<typeof TOKENS>((resolve) =>
        setTimeout(() => resolve(TOKENS), 10),
      ),
  );

  const results = await Promise.all([
    runSingleFlight(state, 'rt', refresh),
    runSingleFlight(state, 'rt', refresh),
    runSingleFlight(state, 'rt', refresh),
  ]);

  expect(refresh).toHaveBeenCalledTimes(1);
  expect(results).toEqual([TOKENS, TOKENS, TOKENS]);
});

test('one refresh per request: a later sequential call reuses the cached tokens', async () => {
  const state = freshState();
  const refresh = vi.fn().mockResolvedValue(TOKENS);

  // First wave settles, THEN a second wave runs in the same request scope.
  await runSingleFlight(state, 'rt', refresh);
  const second = await runSingleFlight(state, 'rt', refresh);

  expect(refresh).toHaveBeenCalledTimes(1);
  expect(second).toEqual(TOKENS);
  expect(state.tokens).toEqual(TOKENS);
});

test('isolation: a separate request (state) refreshes independently', async () => {
  const refresh = vi.fn().mockResolvedValue(TOKENS);
  await runSingleFlight(freshState(), 'rt', refresh);
  await runSingleFlight(freshState(), 'rt', refresh);
  expect(refresh).toHaveBeenCalledTimes(2);
});

test('a failed refresh does not cache, so the request can retry', async () => {
  const state = freshState();
  const refresh = vi
    .fn()
    .mockRejectedValueOnce(new Error('boom'))
    .mockResolvedValueOnce(TOKENS);

  await expect(runSingleFlight(state, 'rt', refresh)).rejects.toThrow('boom');
  expect(state.tokens).toBeNull();
  expect(state.inflight).toBeNull();

  await expect(runSingleFlight(state, 'rt', refresh)).resolves.toEqual(TOKENS);
  expect(refresh).toHaveBeenCalledTimes(2);
});
