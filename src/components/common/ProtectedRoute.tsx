import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthStore, type AuthUser } from '../../stores/authStore';
import { ROUTES } from '../../config/routes';

interface ProtectedRouteProps {
    /** The component to render if authorized */
    children: React.ReactNode;
    /** Roles that are allowed. If empty/undefined, any authenticated user is allowed. */
    allowedRoles?: AuthUser['role'][];
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
    if (allowedRoles && allowedRoles.length > 0 && user) {
        if (!allowedRoles.includes(user.role)) {
            // Redirect based on role: customers → passenger portal, staff → admin
            const fallback = user.role === 'customer' ? ROUTES.MY_DASHBOARD : ROUTES.DASHBOARD;
            return <Navigate to={fallback} replace />;
        }
    }

    // YubiKey enforcement: admin users with a registered key must verify before accessing admin routes
    if (user?.requiresYubikeyVerification && location.pathname !== ROUTES.YUBIKEY_VERIFY) {
        return <Navigate to={ROUTES.YUBIKEY_VERIFY} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
