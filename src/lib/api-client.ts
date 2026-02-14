/**
 * Thin centralized fetch wrapper for client-side API calls.
 *
 * Provides uniform error normalization, shared defaults, and auth error
 * detection. All methods are relative-path based (same-origin).
 */

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

type ApiErrorBody = {
  error?: string;
  message?: string;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401 || response.status === 403) {
    throw new AuthenticationError("Unauthorized access");
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body: ApiErrorBody = await response.json();
      if (body.error) {
        message = body.error;
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      // response body is not JSON — use the default message
    }
    throw new Error(message);
  }

  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

const defaultHeaders: HeadersInit = {
  "Content-Type": "application/json",
};

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const response = await fetch(path, {
      method: "GET",
      cache: "no-store",
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(path, {
      method: "POST",
      headers: defaultHeaders,
      cache: "no-store",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(path, {
      method: "PUT",
      headers: defaultHeaders,
      cache: "no-store",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(path, {
      method: "DELETE",
      cache: "no-store",
    });
    return handleResponse<T>(response);
  },
};
