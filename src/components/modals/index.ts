import dynamic from 'next/dynamic';

export const AddToFavoritesModal: any = dynamic(
  () => import('./AddToFavorites').then((mod) => mod.AddToFavoritesModal),
  { ssr: false }
);

export const PromptAuthModal: any = dynamic(
  () => import('./PromptAuth').then((mod) => mod.PromptAuthModal),
  { ssr: false }
);

export const SendSmsModal: any = dynamic(
  () => import('./SendSMS').then((mod) => mod.SendSMS),
  { ssr: false }
);

export const ShareModal: any = dynamic(
  () => import('./Share').then((mod) => mod.ShareModal),
  {
    ssr: false,
  }
);

export const UpdateLocationModal: any = dynamic(
  () => import('./UpdateLocation').then((mod) => mod.UpdateLocation),
  { ssr: false }
);
