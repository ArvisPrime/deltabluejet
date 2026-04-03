import { create } from 'zustand';

export type MfaMethod = 'yubikey' | 'totp';

export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: string;
    /** @deprecated Use requiresMfaVerification + pendingMfaMethods instead */
    requiresYubikeyVerification?: boolean;
    /** True when admin must complete MFA before accessing the dashboard */
    requiresMfaVerification?: boolean;
    /** Which MFA methods are pending verification this session */
    pendingMfaMethods?: MfaMethod[];
}

interface AuthState {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    setUser: (user: AuthUser | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,

    setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
    }),

    setLoading: (isLoading) => set({ isLoading }),

    logout: () => set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
    }),
}));
