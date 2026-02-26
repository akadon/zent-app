const API_URL = import.meta.env.VITE_API_URL || "/api";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    this.token = localStorage.getItem("token");
    return this.token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Request failed" }));
      const retryAfter = res.headers.get("X-RateLimit-Reset-After") || res.headers.get("Retry-After");
      throw new ApiError(res.status, error.message ?? "Request failed", retryAfter ? parseFloat(retryAfter) : undefined);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body: unknown) {
    return this.request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number
  ) {
    super(message);
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

export const api = new ApiClient();
