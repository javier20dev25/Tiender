import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SignInForm from './SignInForm';

describe('SignInForm', () => {
  it('should render email, password inputs and a submit button', () => {
    render(
      <MemoryRouter>
        <SignInForm />
      </MemoryRouter>
    );

    // Check for phone input using the Spanish label
    const phoneInput = screen.getByLabelText(/número de whatsapp/i);
    expect(phoneInput).toBeInTheDocument();

    // Check for password input using the Spanish label
    const passwordInput = screen.getByLabelText(/contraseña/i);
    expect(passwordInput).toBeInTheDocument();

    // Check for submit button using the Spanish text
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    expect(submitButton).toBeInTheDocument();
  });
});
