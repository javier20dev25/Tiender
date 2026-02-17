import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import * as AuthContextModule from '../context/AuthContext';
import '@testing-library/jest-dom';

// Mock useAuth
const useAuthMock = vi.fn();
vi.mock('../context/AuthContext', async () => {
    const actual = await vi.importActual('../context/AuthContext');
    return {
        ...actual,
        useAuth: () => useAuthMock(),
    };
});

// Component to protect
const DashboardMock = () => <div>Dashboard Protected Content</div>;
const LoginMock = () => <div>Login Page</div>;
const UpgradeMock = () => <div>Upgrade Page</div>;

describe('Trial & Grace Period Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const setup = (subscriptionStatus: string | null) => {
        useAuthMock.mockReturnValue({
            user: { id: 'test-user', email: 'test@example.com' },
            subscription: subscriptionStatus ? { status: subscriptionStatus, current_period_end: new Date().toISOString() } : null,
            loading: false,
        });

        render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <Routes>
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <DashboardMock />
                        </ProtectedRoute>
                    } />
                    <Route path="/auth" element={<LoginMock />} />
                    <Route path="/upgrade" element={<UpgradeMock />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('should allow access to users in "trialing" status', () => {
        setup('trialing');
        expect(screen.getByText('Dashboard Protected Content')).toBeInTheDocument();
    });

    it('should allow access to users in "active" status', () => {
        setup('active');
        expect(screen.getByText('Dashboard Protected Content')).toBeInTheDocument();
    });

    it('should allow access to users in "past_due" status (Grace Period)', () => {
        // This confirms the Grace Period logic: user is NOT redirected to upgrade/payment immediately
        setup('past_due');
        expect(screen.getByText('Dashboard Protected Content')).toBeInTheDocument();
    });

    it('should redirect users in "unpaid" status to upgrade page', () => {
        setup('unpaid');
        expect(screen.queryByText('Dashboard Protected Content')).not.toBeInTheDocument();
        expect(screen.getByText('Upgrade Page')).toBeInTheDocument();
    });

    it('should redirect users in "canceled" status to upgrade page', () => {
        setup('canceled');
        expect(screen.queryByText('Dashboard Protected Content')).not.toBeInTheDocument();
        expect(screen.getByText('Upgrade Page')).toBeInTheDocument();
    });

    it('should redirect users with NO subscription to upgrade page', () => {
        setup(null);
        expect(screen.queryByText('Dashboard Protected Content')).not.toBeInTheDocument();
        expect(screen.getByText('Upgrade Page')).toBeInTheDocument();
    });
});
