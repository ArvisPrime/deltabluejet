import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthStore, type AuthUser } from '../../stores/authStore';
import { ROUTES } from '../../config/routes';

interface ProtectedRouteProps {
    /** The component to render if authorized */
    children: React.ReactNode;
    /** Roles that are allowed. Can be an array of role strings, or a check function. If empty/undefined, any authenticated user is allowed. */
    allowedRoles?: string[] | ((role: string) => boolean);
}

/**
 * Route guard that redirects unauthenticated users to login
 * and unauthorized users to the dashboard.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { isAuthenticated, isLoading, user } = useAuthStore();
    const location = useLocation();

    // Show loading spinner while Firebase is checking auth state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-navy-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-navy-400 font-display text-xs uppercase tracking-[0.3em]">Verifying Access</p>
                </div>
            </div>
        );
    }

    // Not authenticated → redirect to login (preserve intended URL)
    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    // Check role-based access
    if (allowedRoles && user) {
        const isAllowed = typeof allowedRoles === 'function'
            ? allowedRoles(user.role)
            : allowedRoles.length === 0 || allowedRoles.includes(user.role);
        if (!isAllowed) {
            // Redirect based on role: customers → passenger portal, staff → admin
            const fallback = user.role === 'customer' ? ROUTES.MY_DASHBOARD : ROUTES.DASHBOARD;
            return <Navigate to={fallback} replace />;
        }
    }

    // MFA enforcement: admin users with pending MFA must verify before accessing admin routes
    // NOTE: YubiKey enforcement is currently disabled
    const mfaExemptPaths = [ROUTES.TOTP_VERIFY];
    const isOnMfaPage = mfaExemptPaths.includes(location.pathname as any);

    if (user?.requiresMfaVerification && !isOnMfaPage) {
        const pending = user.pendingMfaMethods || [];
        if (pending.includes('totp')) {
            return <Navigate to={ROUTES.TOTP_VERIFY} replace />;
        }
        // YubiKey redirect disabled
    }

    return <>{children}</>;
};

export default ProtectedRoute;
