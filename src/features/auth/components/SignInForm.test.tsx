import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
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

    // Check for phone input using the Spanish placeholder
    const phoneInput = screen.getByPlaceholderText(/Número de WhatsApp/i);
    expect(phoneInput).toBeInTheDocument();

    // Check for password input using the Spanish placeholder
    const passwordInput = screen.getByPlaceholderText(/Tu Contraseña/i);
    expect(passwordInput).toBeInTheDocument();

    // Check for submit button using the Spanish text
    const submitButton = screen.getByRole('button', { name: /Entrar a mi Tienda/i });
    expect(submitButton).toBeInTheDocument();
  });
});
