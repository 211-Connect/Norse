'use client';
import { createContext, useContext, useMemo, useState } from 'react';

type FilterPanelContextType = {
  open: boolean;
  setOpen: (newValue: boolean) => void;
};

const filterPanelContext = createContext<FilterPanelContextType | undefined>(
  undefined,
);

type FilterPanelProviderProps = {
  children: React.ReactNode;
};

export function FilterPanelProvider({ children }: FilterPanelProviderProps) {
  const [open, setOpen] = useState(false);

  const context = useMemo(() => ({ open, setOpen }), [open, setOpen]);

  return (
    <filterPanelContext.Provider value={context}>
      {children}
    </filterPanelContext.Provider>
  );
}

export function useFilterPanel() {
  const context = useContext(filterPanelContext);
  if (!context) {
    throw new Error(
      'useFilterPanel must be used within an FilterPanelProvider',
    );
  }
  return context;
}
