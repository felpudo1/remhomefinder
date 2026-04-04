import { create } from "zustand";

/**
 * Estado de una tarea de importación masiva activa.
 * Persiste entre navegación (Zustand global) y se re-hidrata desde BD al recargar.
 */
interface ImportTask {
  taskId: string;
  orgId: string;
  domainUrl: string;
  totalLinks: number;
  completedLinks: number;
  failedLinks: number;
  status: "discovering" | "selecting" | "importing" | "completed" | "error";
}

interface ImportState {
  activeTask: ImportTask | null;
  isModalOpen: boolean;
  isMinimized: boolean;

  actions: {
    setTask: (task: ImportTask | null) => void;
    updateProgress: (completed: number, failed: number) => void;
    setStatus: (status: ImportTask["status"]) => void;
    openModal: () => void;
    closeModal: () => void;
    minimize: () => void;
    restore: () => void;
    reset: () => void;
  };
}

const useImportStore = create<ImportState>((set) => ({
  activeTask: null,
  isModalOpen: false,
  isMinimized: false,

  actions: {
    setTask: (task) => set({ activeTask: task }),
    updateProgress: (completed, failed) =>
      set((state) => ({
        activeTask: state.activeTask
          ? { ...state.activeTask, completedLinks: completed, failedLinks: failed }
          : null,
      })),
    setStatus: (status) =>
      set((state) => ({
        activeTask: state.activeTask ? { ...state.activeTask, status } : null,
      })),
    openModal: () => set({ isModalOpen: true, isMinimized: false }),
    closeModal: () => set({ isModalOpen: false }),
    minimize: () => set({ isModalOpen: false, isMinimized: true }),
    restore: () => set({ isModalOpen: true, isMinimized: false }),
    reset: () => set({ activeTask: null, isModalOpen: false, isMinimized: false }),
  },
}));

// Selectores granulares para evitar re-renders innecesarios
export const useActiveImportTask = () => useImportStore((s) => s.activeTask);
export const useImportModalOpen = () => useImportStore((s) => s.isModalOpen);
export const useImportMinimized = () => useImportStore((s) => s.isMinimized);
export const useImportActions = () => useImportStore((s) => s.actions);

export default useImportStore;
