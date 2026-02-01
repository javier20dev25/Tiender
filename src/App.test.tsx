// src/App.test.tsx
import { screen } from '@testing-library/react';
import App from './App';
import { render } from './test-utils'; // Importar el render custom

describe('App Routing', () => {
  it('should render AuthPage for the /auth route', () => {
    render(<App />, { route: '/auth' });
    expect(screen.getByRole('heading', { name: /crear una cuenta/i })).toBeInTheDocument();
  });

  it('should redirect from / to /auth', () => {
    render(<App />, { route: '/' });
    expect(screen.getByRole('heading', { name: /crear una cuenta/i })).toBeInTheDocument();
  });

  it('should render DashboardPage with store details for the /dashboard route', async () => {
    // 'render' de test-utils ya simula un usuario autenticado con una tienda.
    render(<App />, { route: '/dashboard' });

    // Verificar que el dashboard se renderiza con los datos de la tienda del mock.
    expect(await screen.findByText(/Tu Tienda: Tienda de Prueba/i)).toBeInTheDocument();
  });
});