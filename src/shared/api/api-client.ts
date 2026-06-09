export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly data?: unknown,
  ) {
    super(`API ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

export type ApiFetchOptions = RequestInit & {
  json?: unknown;
  /** Override the request base URL. Defaults to `env.NEXT_PUBLIC_API_URL`. */
  baseUrl?: string;
};

/**
 * Thin `fetch` wrapper used by both Server Components (server reads, hooked into
 * the Next.js Data Cache) and client React Query `queryFn`s. Pass Next caching
 * options (`cache`, `next: { revalidate, tags }`) straight through `options`.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { json, body, headers, baseUrl, ...init } = options;

  const finalHeaders = new Headers(headers);
  if (json !== undefined) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  // Default base reads NEXT_PUBLIC_API_URL directly (statically inlined by Next,
  // client-safe) so this isomorphic module never imports the server `env` — which
  // would drag the server schema + upstream URL into the client bundle. Server
  // callers (serverFetch) pass `baseUrl: env.API_BASE_URL` explicitly.
  const base =
    baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: finalHeaders,
    body: json !== undefined ? JSON.stringify(json) : body,
  });

  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      // response had no JSON body
    }
    throw new ApiError(response.status, response.statusText, data);
  }

  return response.status === 204
    ? (undefined as T)
    : (response.json() as Promise<T>);
}
