const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

type FetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

async function adminFetch<T>(
  path: string,
  token: string | null,
  options: FetchOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export const adminGet = async <T>(path: string, token: string | null) =>
  adminFetch<T>(path, token, { method: "GET" });

export const adminPost = async <T>(
  path: string,
  token: string | null,
  body?: unknown,
) =>
  adminFetch<T>(path, token, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });

export const adminDelete = async <T>(path: string, token: string | null) =>
  adminFetch<T>(path, token, { method: "DELETE" });
