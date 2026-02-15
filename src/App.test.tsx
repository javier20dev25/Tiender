// src/App.test.tsx
import { screen, waitFor } from '@testing-library/react';
import App from './App';
import { render } from './test-utils'; // Importar el render custom

describe('App Routing', () => {
  it('should render HomePage for the / route', () => {
    render(<App />, { route: '/' });
    // Assert that the HomePage heading is visible
    expect(screen.getByRole('heading', { name: /Crea tu Tienda Online en Minutos/i })).toBeInTheDocument();
  });

  it('should render AuthPage for the /auth route', () => {
    render(<App />, { route: '/auth' });
    expect(screen.getByRole('heading', { name: /crear una cuenta/i })).toBeInTheDocument();
  });

  it('should render DashboardPage with store details for the /dashboard route', async () => {
    // 'render' de test-utils ya simula un usuario autenticado con una tienda.
    render(<App />, { route: '/dashboard' });

    // Esperar a que el estado de carga se complete y los datos se rendericen
    await waitFor(() => {
      // Asegurarse de que el texto de carga ya no está presente y el contenido del dashboard sí
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText(/Tu Tienda: Mi Tienda/i)).toBeInTheDocument();
    });
  });
});
