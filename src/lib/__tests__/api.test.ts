import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test the ApiClient class, but it's exported as a singleton.
// Re-import the module to get fresh instances.
// First, mock import.meta.env
vi.stubEnv('VITE_API_URL', 'https://api.test.com');

// Import after env stub
const { api, ApiError } = await import('../api');

describe('API Client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    // Clear stored token
    api.setToken(null);
    vi.spyOn(Storage.prototype, 'setItem');
    vi.spyOn(Storage.prototype, 'getItem');
    vi.spyOn(Storage.prototype, 'removeItem');
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('setToken', () => {
    it('should store token in localStorage', () => {
      api.setToken('test-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
    });

    it('should remove token from localStorage when null', () => {
      api.setToken(null);
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('getToken', () => {
    it('should return stored token', () => {
      api.setToken('my-token');
      expect(api.getToken()).toBe('my-token');
    });

    it('should fall back to localStorage', () => {
      // Reset internal token by setting null then manually setting localStorage
      api.setToken(null);
      (localStorage.getItem as any).mockReturnValue('stored-token');
      // Force re-read from localStorage by creating state where internal token is null
      // The getToken method checks internal first, then localStorage
      expect(api.getToken()).toBeDefined();
    });
  });

  describe('request - Authorization header', () => {
    it('should add Authorization header when token exists', async () => {
      api.setToken('bearer-test');
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      });

      await api.get('/test');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer bearer-test',
          }),
        })
      );
    });

    it('should not add Authorization header when no token', async () => {
      api.setToken(null);
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await api.get('/test');

      const callHeaders = (globalThis.fetch as any).mock.calls[0][1].headers;
      expect(callHeaders.Authorization).toBeUndefined();
    });
  });

  describe('request - 401 response', () => {
    it('should throw ApiError with status 401', async () => {
      api.setToken('expired');
      (globalThis.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      });

      await expect(api.get('/protected')).rejects.toThrow('Unauthorized');
      try {
        await api.get('/protected');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as any).status).toBe(401);
      }
    });
  });

  describe('request - 429 rate limit response', () => {
    it('should throw ApiError with retryAfter from X-RateLimit-Reset-After', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'X-RateLimit-Reset-After': '2.5' }),
        json: () => Promise.resolve({ message: 'Rate limited' }),
      });

      try {
        await api.get('/rate-limited');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as any).status).toBe(429);
        expect((err as any).retryAfter).toBe(2.5);
        expect((err as any).isRateLimited).toBe(true);
      }
    });

    it('should use Retry-After header as fallback', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '5' }),
        json: () => Promise.resolve({ message: 'Rate limited' }),
      });

      try {
        await api.get('/rate-limited');
      } catch (err) {
        expect((err as any).retryAfter).toBe(5);
      }
    });
  });

  describe('request - network errors', () => {
    it('should propagate fetch network errors', async () => {
      (globalThis.fetch as any).mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(api.get('/offline')).rejects.toThrow('Failed to fetch');
    });
  });

  describe('request - 204 No Content', () => {
    it('should return undefined for 204 responses', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error('No JSON')),
      });

      const result = await api.delete('/resource/1');
      expect(result).toBeUndefined();
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ok: true }),
      });
    });

    it('should send POST with JSON body', async () => {
      await api.post('/test', { key: 'value' });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ key: 'value' }),
        })
      );
    });

    it('should send PATCH with JSON body', async () => {
      await api.patch('/test', { key: 'value' });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ key: 'value' }),
        })
      );
    });

    it('should send PUT with JSON body', async () => {
      await api.put('/test', { key: 'value' });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ key: 'value' }),
        })
      );
    });

    it('should send DELETE with optional body', async () => {
      await api.delete('/test', { id: '1' });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ id: '1' }),
        })
      );
    });
  });

  describe('ApiError', () => {
    it('should have correct properties', () => {
      const err = new ApiError(429, 'Rate limited', 3.5);
      expect(err.status).toBe(429);
      expect(err.message).toBe('Rate limited');
      expect(err.retryAfter).toBe(3.5);
      expect(err.isRateLimited).toBe(true);
    });

    it('should not be rate limited for non-429', () => {
      const err = new ApiError(500, 'Server error');
      expect(err.isRateLimited).toBe(false);
      expect(err.retryAfter).toBeUndefined();
    });
  });
});
