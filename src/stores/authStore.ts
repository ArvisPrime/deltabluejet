import { create } from 'zustand';

export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: 'super_admin' | 'ops_manager' | 'crew_sched' | 'cs_agent' | 'customer';
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
