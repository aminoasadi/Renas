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
 * Every admin request goes through here, hitting a relative /api/v1 path
 * that next.config.mjs rewrites (server-side) to the real API. Keeping the
 * browser's request same-origin — rather than a cross-origin fetch baked
 * with a build-time API URL — sidesteps both CORS and cross-site cookie
 * (SameSite) issues, and means the real API URL only needs to exist as a
 * runtime env var, not a Docker build arg.
 */
export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; isFormData?: boolean } = {},
): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
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
