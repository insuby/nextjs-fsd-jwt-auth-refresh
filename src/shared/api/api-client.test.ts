import { afterEach, expect, test, vi } from 'vitest';

import { ApiError, apiFetch } from 'shared/api';

afterEach(() => {
  vi.unstubAllGlobals();
});

test('apiFetch returns parsed JSON for a 2xx response', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );

  await expect(apiFetch('/items/1')).resolves.toEqual({ id: 1 });
});

test('apiFetch throws ApiError for a non-2xx response', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response('nope', { status: 404, statusText: 'Not Found' }),
      ),
  );

  await expect(apiFetch('/items/999')).rejects.toBeInstanceOf(ApiError);
});
