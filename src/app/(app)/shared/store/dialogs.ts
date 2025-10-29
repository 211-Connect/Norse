import { atom } from 'jotai';

export const dialogsAtom = atom({
  promptAuth: {
    open: false,
  },
});

export const promptAuthAtom = atom((get) => get(dialogsAtom).promptAuth);
