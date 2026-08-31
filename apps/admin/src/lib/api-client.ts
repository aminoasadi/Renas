const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

export class ApiError extends Error {
  code: string;
  details?: unknown;
  status: number;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Every admin request goes through here. `credentials: "include"` is what
 * makes the session cookie work even though the admin app is served from a
 * different subdomain than the API — see docs/architecture.md's note on
 * why the admin is a client-fetching app rather than doing session-aware
 * server-side rendering against a cross-origin API.
 */
export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; isFormData?: boolean } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: options.isFormData ? undefined : { "Content-Type": "application/json" },
    body: options.isFormData ? (options.body as FormData) : options.body ? JSON.stringify(options.body) : undefined,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:session-expired"));
    }
    throw new ApiError(res.status, body?.error?.code ?? "UNKNOWN", body?.error?.message ?? "Request failed", body?.error?.details);
  }

  return body?.data as T;
}

export { API_URL };
