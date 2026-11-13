import { atom } from 'jotai';

export const dialogsAtom = atom({
  promptAuth: {
    open: false,
    returnFocusTo: null as HTMLElement | null,
  },
});

export const promptAuthAtom = atom((get) => get(dialogsAtom).promptAuth);

/** True while the red emergency popup is open. Quick exit then shows at every width, above the dim layer. */
export const emergencyPopupOpenAtom = atom(false);
