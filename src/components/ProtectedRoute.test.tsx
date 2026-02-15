import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';

// Mock the useAuth hook
vi.mock('../context/AuthContext');

const mockUseAuth = useAuth as vi.Mock;

describe('ProtectedRoute', () => {
  it('should render the component for authenticated users with active subscription', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123' },
      loading: false,
      subscription: { status: 'active' },
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<ProtectedRoute><div data-testid="dashboard-content">Dashboard</div></ProtectedRoute>} />
          <Route path="/auth" element={<div>Auth Page</div>} />
          <Route path="/upgrade" element={<div data-testid="upgrade-page">Upgrade</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
  });

  it('should redirect to /auth for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      subscription: null,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<ProtectedRoute><div data-testid="dashboard-content">Dashboard</div></ProtectedRoute>} />
          <Route path="/auth" element={<div data-testid="auth-page">Auth Page</div>} />
          <Route path="/upgrade" element={<div data-testid="upgrade-page">Upgrade</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
  });

  it('should show a loading indicator while auth state is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      subscription: null,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<ProtectedRoute><div>Dashboard</div></ProtectedRoute>} />
          <Route path="/upgrade" element={<div data-testid="upgrade-page">Upgrade</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should redirect to /upgrade for users without active subscription', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123' },
      loading: false,
      subscription: { status: 'canceled' },
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<ProtectedRoute><div data-testid="dashboard-content">Dashboard</div></ProtectedRoute>} />
          <Route path="/auth" element={<div data-testid="auth-page">Auth Page</div>} />
          <Route path="/upgrade" element={<div data-testid="upgrade-page">Upgrade</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('upgrade-page')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
  });
});
