import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../src/stores/authStore';

describe('authStore — RBAC roles', () => {
    beforeEach(() => {
        useAuthStore.setState({ user: null, isLoading: false, isAuthenticated: false });
    });

    it('should correctly set super_admin role', () => {
        useAuthStore.getState().setUser({
            uid: 'admin-1',
            email: 'admin@deltabluejet.com',
            displayName: 'Admin',
            photoURL: null,
            role: 'super_admin',
        });
        expect(useAuthStore.getState().user?.role).toBe('super_admin');
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('should correctly set ops_manager role', () => {
        useAuthStore.getState().setUser({
            uid: 'ops-1',
            email: 'ops@deltabluejet.com',
            displayName: 'Ops Manager',
            photoURL: null,
            role: 'ops_manager',
        });
        expect(useAuthStore.getState().user?.role).toBe('ops_manager');
    });

    it('should correctly set customer role', () => {
        useAuthStore.getState().setUser({
            uid: 'cust-1',
            email: 'john@gmail.com',
            displayName: 'John Doe',
            photoURL: null,
            role: 'customer',
        });
        expect(useAuthStore.getState().user?.role).toBe('customer');
    });

    it('should handle all valid role types', () => {
        const roles = ['super_admin', 'ops_manager', 'crew_sched', 'cs_agent', 'customer'] as const;
        roles.forEach((role) => {
            useAuthStore.getState().setUser({
                uid: `user-${role}`,
                email: `${role}@test.com`,
                displayName: role,
                photoURL: null,
                role,
            });
            expect(useAuthStore.getState().user?.role).toBe(role);
        });
    });
});
