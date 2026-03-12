import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthPage } from '../auth/auth-page';

// Mock dependencies
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      login: mockLogin,
      register: mockRegister,
      verifyMfa: vi.fn(),
      setAuth: vi.fn(),
      guestLogin: mockGuestLogin,
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('lucide-react', () => ({
  Fingerprint: () => <span data-testid="fingerprint-icon" />,
}));

const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockGuestLogin = vi.fn();

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
    mockRegister.mockResolvedValue(undefined);
    mockGuestLogin.mockResolvedValue(undefined);
  });

  it('should render login form with email and password inputs', () => {
    render(<AuthPage />);
    expect(screen.getByTestId('auth-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('auth-password-input')).toBeInTheDocument();
  });

  it('should render "Welcome back!" heading in login mode', () => {
    render(<AuthPage />);
    expect(screen.getByText('Welcome back!')).toBeInTheDocument();
  });

  it('should render guest button', () => {
    render(<AuthPage />);
    expect(screen.getByTestId('auth-guest-button')).toBeInTheDocument();
    expect(screen.getByText('Continue as Guest')).toBeInTheDocument();
  });

  it('should render Log In button', () => {
    render(<AuthPage />);
    expect(screen.getByTestId('auth-login-button')).toBeInTheDocument();
    expect(screen.getByText('Log In')).toBeInTheDocument();
  });

  it('should switch to register mode and show username field', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByTestId('auth-register-link'));

    expect(screen.getByText('Create an account')).toBeInTheDocument();
    expect(screen.getByTestId('auth-username-input')).toBeInTheDocument();
  });

  it('should render Continue button in register mode', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByTestId('auth-register-link'));
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  it('should call login on form submission', async () => {
    render(<AuthPage />);

    fireEvent.change(screen.getByTestId('auth-email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('auth-password-input'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByTestId('auth-login-button'));

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should call guestLogin when guest button is clicked', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByTestId('auth-guest-button'));
    expect(mockGuestLogin).toHaveBeenCalled();
  });

  it('should not show guest button in register mode', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByTestId('auth-register-link'));
    expect(screen.queryByTestId('auth-guest-button')).not.toBeInTheDocument();
  });

  it('should show Register link in login mode', () => {
    render(<AuthPage />);
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('should show Log In link in register mode', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByTestId('auth-register-link'));
    expect(screen.getByText('Log In')).toBeInTheDocument();
  });
});
