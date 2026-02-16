import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { render } from './test-utils'; // Importar el render custom

describe('App Routing', () => {
  it('should render HomePage for the / route', () => {
    render(<App />, { route: '/' });
    // Assert that the HomePage heading is visible
    expect(screen.getByRole('heading', { name: /Tu Tienda Social es Real/i })).toBeInTheDocument();
  });

  it('should render AuthPage for the /auth route', () => {
    render(<App />, { route: '/auth' });
    expect(screen.getByRole('heading', { name: /Únete a la Revolución/i })).toBeInTheDocument();
  });

  it('should render DashboardPage with store details for the /dashboard route', async () => {
    // 'render' de test-utils ya simula un usuario autenticado con una tienda.
    render(<App />, { route: '/dashboard' });

    // Esperar a que el estado de carga se complete y los datos se rendericen
    await waitFor(() => {
      // Asegurarse de que el texto de carga ya no está presente y el contenido del dashboard sí
      expect(screen.queryByText(/Cargando tu centro de mando/i)).not.toBeInTheDocument();
      expect(screen.getByText('Mi Tienda')).toBeInTheDocument();
    });
  });
});
