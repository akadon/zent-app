import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../auth';

// Mock the api module
vi.mock('@/lib/api', () => {
  const mockApi = {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    setToken: vi.fn(),
    getToken: vi.fn(),
  };
  return { api: mockApi };
});

// Get mocked api for assertions
import { api } from '@/lib/api';
const mockApi = vi.mocked(api);

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: true,
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have user as null', () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('should have token as null', () => {
      expect(useAuthStore.getState().token).toBeNull();
    });

    it('should have isLoading as true', () => {
      expect(useAuthStore.getState().isLoading).toBe(true);
    });
  });

  describe('setAuth', () => {
    it('should set user and token', () => {
      const user = { id: '1', username: 'test', isGuest: false } as any;
      useAuthStore.getState().setAuth('test-token', user);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.token).toBe('test-token');
      expect(mockApi.setToken).toHaveBeenCalledWith('test-token');
    });
  });

  describe('logout', () => {
    it('should clear user, token, and call api.setToken(null)', () => {
      // Set up some state first
      useAuthStore.setState({
        user: { id: '1', username: 'test' } as any,
        token: 'some-token',
      });
      mockApi.delete.mockResolvedValue(undefined);

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(mockApi.setToken).toHaveBeenCalledWith(null);
    });

    it('should fire and forget session revocation', () => {
      mockApi.delete.mockResolvedValue(undefined);
      useAuthStore.getState().logout();
      expect(mockApi.delete).toHaveBeenCalledWith('/users/@me/sessions/current');
    });
  });

  describe('isGuest', () => {
    it('should return true when user.isGuest is true', () => {
      useAuthStore.setState({
        user: { id: '1', username: 'guest', isGuest: true } as any,
      });
      expect(useAuthStore.getState().isGuest()).toBe(true);
    });

    it('should return false for regular users', () => {
      useAuthStore.setState({
        user: { id: '1', username: 'test', isGuest: false } as any,
      });
      expect(useAuthStore.getState().isGuest()).toBe(false);
    });

    it('should return false when user is null', () => {
      useAuthStore.setState({ user: null });
      expect(useAuthStore.getState().isGuest()).toBe(false);
    });
  });

  describe('login', () => {
    it('should call API and set state on successful login', async () => {
      const user = { id: '1', username: 'test' };
      mockApi.post.mockResolvedValue({ token: 'login-token', user });

      await useAuthStore.getState().login('test@example.com', 'password');

      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password',
      });
      expect(mockApi.setToken).toHaveBeenCalledWith('login-token');
      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.token).toBe('login-token');
    });

    it('should return MFA required when token is null and mfa is true', async () => {
      mockApi.post.mockResolvedValue({ token: null, mfa: true, ticket: 'mfa-ticket-123' });

      const result = await useAuthStore.getState().login('test@example.com', 'password');

      expect(result).toEqual({ mfa: true, ticket: 'mfa-ticket-123' });
      expect(mockApi.setToken).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should call API and set state', async () => {
      const user = { id: '2', username: 'newuser' };
      mockApi.post.mockResolvedValue({ token: 'register-token', user });

      await useAuthStore.getState().register('new@example.com', 'newuser', 'password');

      expect(mockApi.post).toHaveBeenCalledWith('/auth/register', {
        email: 'new@example.com',
        username: 'newuser',
        password: 'password',
      });
      expect(mockApi.setToken).toHaveBeenCalledWith('register-token');
      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.token).toBe('register-token');
    });
  });

  describe('guestLogin', () => {
    it('should call API and set state with isLoading false', async () => {
      const user = { id: '3', username: 'guest', isGuest: true };
      mockApi.post.mockResolvedValue({ token: 'guest-token', user });

      await useAuthStore.getState().guestLogin();

      expect(mockApi.post).toHaveBeenCalledWith('/auth/guest');
      expect(mockApi.setToken).toHaveBeenCalledWith('guest-token');
      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.token).toBe('guest-token');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('claimAccount', () => {
    it('should call API and update user', async () => {
      const updatedUser = { id: '3', username: 'claimed', isGuest: false };
      mockApi.post.mockResolvedValue({ user: updatedUser });

      await useAuthStore.getState().claimAccount('claim@example.com', 'claimed', 'password');

      expect(mockApi.post).toHaveBeenCalledWith('/auth/claim', {
        email: 'claim@example.com',
        username: 'claimed',
        password: 'password',
      });
      expect(useAuthStore.getState().user).toEqual(updatedUser);
    });
  });

  describe('loadSession', () => {
    it('should set isLoading false when no token exists', async () => {
      mockApi.getToken.mockReturnValue(null);

      await useAuthStore.getState().loadSession();

      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(mockApi.get).not.toHaveBeenCalled();
    });

    it('should validate token and set user on success', async () => {
      const user = { id: '1', username: 'test' };
      mockApi.getToken.mockReturnValue('valid-token');
      mockApi.get.mockResolvedValue(user);

      await useAuthStore.getState().loadSession();

      expect(mockApi.get).toHaveBeenCalledWith('/users/@me');
      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.token).toBe('valid-token');
      expect(state.isLoading).toBe(false);
    });

    it('should clear state on API error', async () => {
      mockApi.getToken.mockReturnValue('invalid-token');
      mockApi.get.mockRejectedValue(new Error('Unauthorized'));

      await useAuthStore.getState().loadSession();

      expect(mockApi.setToken).toHaveBeenCalledWith(null);
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('verifyMfa', () => {
    it('should call API and set auth state', async () => {
      const user = { id: '1', username: 'mfauser' };
      mockApi.post.mockResolvedValue({ token: 'mfa-verified-token', user });

      await useAuthStore.getState().verifyMfa('123456', 'ticket-abc');

      expect(mockApi.post).toHaveBeenCalledWith('/auth/mfa/verify', {
        code: '123456',
        ticket: 'ticket-abc',
      });
      expect(mockApi.setToken).toHaveBeenCalledWith('mfa-verified-token');
      expect(useAuthStore.getState().user).toEqual(user);
      expect(useAuthStore.getState().token).toBe('mfa-verified-token');
    });
  });
});
