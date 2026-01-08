import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthPage from './AuthPage';

// Mock the components to isolate the AuthPage logic
vi.mock('../features/auth/components/SignUpForm', () => ({
  SignUpForm: () => <div><h1>Crear una cuenta</h1></div>
}));

// Note: SignInForm is a default export
vi.mock('../features/auth/components/SignInForm', () => ({
  default: () => <div><h1>Iniciar Sesión</h1></div>
}));


describe('AuthPage', () => {
  it('should render SignUpForm by default', () => {
    render(<AuthPage />);
    expect(screen.getByRole('heading', { name: /crear una cuenta/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /iniciar sesión/i })).not.toBeInTheDocument();
  });

  it('should toggle to SignInForm when the switch link is clicked', () => {
    render(<AuthPage />);

    // Find and click the switch link
    const switchLink = screen.getByRole('button', { name: /ya tienes una cuenta/i });
    fireEvent.click(switchLink);

    // Assert that SignInForm is now visible and SignUpForm is not
    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /crear una cuenta/i })).not.toBeInTheDocument();
  });
});
