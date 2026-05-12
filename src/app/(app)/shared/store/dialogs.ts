import { atom } from 'jotai';

export const dialogsAtom = atom({
  promptAuth: {
    open: false,
    returnFocusTo: null as HTMLElement | null,
  },
});

export const promptAuthAtom = atom((get) => get(dialogsAtom).promptAuth);
