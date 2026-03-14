import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    resetPassword,
    logout as logoutService,
    onAuthChange,
} from '../services/auth';

/**
 * Custom hook for authentication operations.
 * Provides login, register, Google SSO, reset, and logout functions,
 * plus reactive auth state from the Zustand store.
 */
export function useAuth() {
    const { user, isLoading, isAuthenticated } = useAuthStore();

    // Subscribe to auth state changes on mount
    useEffect(() => {
        const unsubscribe = onAuthChange();
        return unsubscribe;
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        return loginWithEmail(email, password);
    }, []);

    const register = useCallback(async (email: string, password: string, displayName: string) => {
        return registerWithEmail(email, password, displayName);
    }, []);

    const googleLogin = useCallback(async () => {
        return loginWithGoogle();
    }, []);

    const sendReset = useCallback(async (email: string) => {
        return resetPassword(email);
    }, []);

    const logout = useCallback(async () => {
        return logoutService();
    }, []);

    return {
        // State
        user,
        isLoading,
        isAuthenticated,

        // Actions
        login,
        register,
        googleLogin,
        sendReset,
        logout,
    };
}
