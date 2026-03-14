import { create } from 'zustand';

interface UIState {
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;

    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
    closeMobileMenu: () => void;

    scanningState: {
        isScanning: boolean;
        type: 'REGISTRY' | 'TELEMETRY' | null;
        label: string;
    };
    startScan: (type: 'REGISTRY' | 'TELEMETRY', label: string) => void;
    stopScan: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarCollapsed: false,
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

    isMobileMenuOpen: false,
    toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
    closeMobileMenu: () => set({ isMobileMenuOpen: false }),

    scanningState: { isScanning: false, type: null, label: '' },
    startScan: (type, label) => set({ scanningState: { isScanning: true, type, label } }),
    stopScan: () => set({ scanningState: { isScanning: false, type: null, label: '' } }),
}));
