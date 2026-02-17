import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { render } from './test-utils'; // Importar el render custom

describe('App Routing', () => {
  it('should render HomePage for the / route', async () => {
    render(<App />, { route: '/' });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Tu Tienda Social es Real/i })).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should render AuthPage for the /auth route', async () => {
    render(<App />, { route: '/auth' });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Únete a la Revolución/i })).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should render DashboardPage with store details for the /dashboard route', async () => {
    render(<App />, { route: '/dashboard' });

    await waitFor(() => {
      expect(screen.queryByText(/Cargando tu centro de mando/i)).not.toBeInTheDocument();
      expect(screen.getByText('Mi Tienda')).toBeInTheDocument();
    }, { timeout: 10000 });
  });
});
