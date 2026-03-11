import { create } from "zustand";

interface UIState {
    isSidebarOpen: boolean;
    // Acciones (Actions) para mutar el estado (REGLA 2: Lógica separada)
    actions: {
        toggleSidebar: () => void;
        setSidebarOpen: (isOpen: boolean) => void;
    };
}

/**
 * Store global para el estado de la UI
 * Centraliza interacciones que no dependen de la base de datos (Server State vs Client State)
 */
const useUIStore = create<UIState>((set) => ({
    isSidebarOpen: true, // Por defecto abierto en desktop

    actions: {
        toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
        setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
    },
}));

// Selectores para un consumo más eficiente (Rendimiento)
export const useIsSidebarOpen = () => useUIStore((state) => state.isSidebarOpen);
export const useUIActions = () => useUIStore((state) => state.actions);

export default useUIStore;
