import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SignUpForm } from './SignUpForm';

describe('SignUpForm', () => {
  it('should render email, password inputs and a submit button', () => {
    render(<SignUpForm />);

    // Check for email input using the Spanish label
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    expect(emailInput).toBeInTheDocument();

    // Check for password input using the Spanish label
    const passwordInput = screen.getByLabelText(/contraseña/i);
    expect(passwordInput).toBeInTheDocument();

    // Check for submit button using the Spanish text
    const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
    expect(submitButton).toBeInTheDocument();
  });
});
