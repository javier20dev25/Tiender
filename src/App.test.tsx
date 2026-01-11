
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { useAuth } from './context/AuthContext';

vi.mock('./context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('App Routing', () => {
  it('should render AuthPage for the /auth route', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false });
    render(
      <MemoryRouter initialEntries={['/auth']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /crear una cuenta/i })).toBeInTheDocument();
  });

  it('should render Dashboard placeholder for the /dashboard route', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'test' }, loading: false });
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('should redirect from / to /auth', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false });
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /crear una cuenta/i })).toBeInTheDocument();
  });
});
