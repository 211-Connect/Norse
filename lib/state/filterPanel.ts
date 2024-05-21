import { create } from 'zustand';

interface FilterPanelStore {
  isOpen: boolean;
  toggle: () => void;
}

export const useFilterPanelStore = create<FilterPanelStore>((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
