import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AuthPage from './AuthPage';

// Mock the components to isolate the AuthPage logic
vi.mock('../features/auth/components/SignUpForm', () => ({
  // The prop is now required, so we need to accept it in the mock.
  SignUpForm: ({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) => (
    <div>
      <h1>Crear una cuenta</h1>
      {/* Allow testing the switch functionality from the error message */}
      <button onClick={onSwitchToSignIn}>Switch</button>
    </div>
  )
}));

vi.mock('../features/auth/components/SignInForm', () => ({
  default: () => <div><h1>Iniciar Sesión</h1></div>
}));


describe('AuthPage', () => {
  it('should render SignUpForm by default', () => {
    render(<AuthPage />, { wrapper: MemoryRouter });
    expect(screen.getByRole('heading', { name: /crear una cuenta/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /iniciar sesión/i })).not.toBeInTheDocument();
  });

  it('should toggle to SignInForm when the switch link is clicked', () => {
    render(<AuthPage />, { wrapper: MemoryRouter });

    const switchLink = screen.getByRole('button', { name: /ya tienes una cuenta/i });
    fireEvent.click(switchLink);

    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /crear una cuenta/i })).not.toBeInTheDocument();
  });
});