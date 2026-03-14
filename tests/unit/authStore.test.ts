import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../src/stores/authStore';

describe('authStore', () => {
    beforeEach(() => {
        // Reset store between tests
        useAuthStore.setState({
            user: null,
            isLoading: true,
            isAuthenticated: false,
        });
    });

    it('should start with no user and loading true', () => {
        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.isLoading).toBe(true);
        expect(state.isAuthenticated).toBe(false);
    });

    it('should set user and mark as authenticated', () => {
        const mockUser = {
            uid: 'test-uid',
            email: 'admin@deltabluejet.com',
            displayName: 'Marcus Chen',
            photoURL: null,
            role: 'super_admin' as const,
        };

        useAuthStore.getState().setUser(mockUser);

        const state = useAuthStore.getState();
        expect(state.user).toEqual(mockUser);
        expect(state.isAuthenticated).toBe(true);
        expect(state.isLoading).toBe(false);
    });

    it('should logout and clear user', () => {
        // First set a user
        useAuthStore.getState().setUser({
            uid: 'test-uid',
            email: 'admin@deltabluejet.com',
            displayName: 'Marcus Chen',
            photoURL: null,
            role: 'super_admin',
        });

        // Then logout
        useAuthStore.getState().logout();

        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.isAuthenticated).toBe(false);
        expect(state.isLoading).toBe(false);
    });

    it('should set loading state', () => {
        useAuthStore.getState().setLoading(false);
        expect(useAuthStore.getState().isLoading).toBe(false);

        useAuthStore.getState().setLoading(true);
        expect(useAuthStore.getState().isLoading).toBe(true);
    });

    it('should clear user when setUser is called with null', () => {
        // First set a user
        useAuthStore.getState().setUser({
            uid: 'test-uid',
            email: 'test@test.com',
            displayName: 'Test',
            photoURL: null,
            role: 'customer',
        });

        // Then clear
        useAuthStore.getState().setUser(null);

        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.isAuthenticated).toBe(false);
    });
});
