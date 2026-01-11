import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignUpForm } from './SignUpForm';
import * as authService from '../services/authService';
import { MemoryRouter } from 'react-router-dom';

// Mocks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}));
vi.mock('../services/authService');

describe('SignUpForm', () => {
  const mockOnSwitch = vi.fn();

  beforeEach(() => {
    // Limpia contadores y mocks antes de cada test.
    vi.clearAllMocks();
  });

  const fillForm = (email = 'test@example.com', whatsapp = '123456789') => {
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: email } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/número de whatsapp/i), { target: { value: whatsapp } });
  };

  it('debería renderizar los campos y el botón', () => {
    render(<SignUpForm onSwitchToSignIn={mockOnSwitch} />, { wrapper: MemoryRouter });
    expect(screen.getByLabelText(/número de whatsapp/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument();
  });

  it('debería llamar a orchestrateSignUp y redirigir en un registro exitoso', async () => {
    vi.mocked(authService.orchestrateSignUp).mockResolvedValue({ success: true, message: 'Éxito' });
    render(<SignUpForm onSwitchToSignIn={mockOnSwitch} />, { wrapper: MemoryRouter });

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(authService.orchestrateSignUp).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/verify-otp', expect.any(Object));
    });
  });

  it('debería mostrar error y CTA para WhatsApp en uso', async () => {
    const error = { isBusinessError: true, error_code: 'WHATSAPP_IN_USE', message: 'Este número de WhatsApp ya está registrado.' };
    vi.mocked(authService.orchestrateSignUp).mockRejectedValue(error);
    render(<SignUpForm onSwitchToSignIn={mockOnSwitch} />, { wrapper: MemoryRouter });

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByText(/Este número de WhatsApp ya está registrado/i)).toBeInTheDocument();
    });
    
    const signInCTA = screen.getByRole('button', { name: /inicia sesión/i });
    fireEvent.click(signInCTA);
    expect(mockOnSwitch).toHaveBeenCalledTimes(1);
  });

  it('debería mostrar error y CTA para email existente', async () => {
    const error = { isBusinessError: true, error_code: 'EMAIL_EXISTS', message: 'Este correo electrónico ya está en uso.' };
    vi.mocked(authService.orchestrateSignUp).mockRejectedValue(error);
    render(<SignUpForm onSwitchToSignIn={mockOnSwitch} />, { wrapper: MemoryRouter });

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByText(/Este correo electrónico ya está en uso/i)).toBeInTheDocument();
    });
    
    const signInCTA = screen.getByRole('button', { name: /inicia sesión/i });
    fireEvent.click(signInCTA);
    expect(mockOnSwitch).toHaveBeenCalledTimes(1);
  });

  it('debería mostrar error y deshabilitar el formulario si el WhatsApp está bloqueado', async () => {
    const error = { isBusinessError: true, error_code: 'WHATSAPP_BLOCKED', message: 'Esta cuenta se encuentra bloqueada.' };
    vi.mocked(authService.orchestrateSignUp).mockRejectedValue(error);
    render(<SignUpForm onSwitchToSignIn={mockOnSwitch} />, { wrapper: MemoryRouter });

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByText(/Esta cuenta se encuentra bloqueada/i)).toBeInTheDocument();
    });
    
    const fieldset = screen.getByRole('group');
    expect(fieldset).toBeDisabled();
  });

  it('debería mostrar un error genérico para fallos inesperados', async () => {
    vi.mocked(authService.orchestrateSignUp).mockRejectedValue({}); // Un objeto vacío, no un Error
    render(<SignUpForm onSwitchToSignIn={mockOnSwitch} />, { wrapper: MemoryRouter });

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByText(/Ocurrió un error inesperado/i)).toBeInTheDocument();
    });
  });
});
