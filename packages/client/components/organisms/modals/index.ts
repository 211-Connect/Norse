import dynamic from 'next/dynamic';

export const AddToFavoritesModal: any = dynamic(
  () => import('./AddToFavorites').then((mod) => mod.AddToFavoritesModal),
  { ssr: false }
);

export const CreateFavoriteListModal: any = dynamic(
  () =>
    import('./CreateAFavoriteList').then((mod) => mod.CreateAFavoriteListModal),
  { ssr: false }
);

export const PromptAuthModal: any = dynamic(
  () => import('./PromptAuth').then((mod) => mod.PromptAuthModal),
  { ssr: false }
);

export const RemoveFavoriteFromListModal: any = dynamic(
  () =>
    import('./RemoveFavoriteFromList').then(
      (mod) => mod.RemoveFavoriteFromList
    ),
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

export const UpdateFavoriteListModal: any = dynamic(
  () =>
    import('./UpdateFavoriteList').then((mod) => mod.UpdateFavoriteListModal),
  { ssr: false }
);

export const DeleteFavoriteListModal: any = dynamic(
  () => import('./DeleteFavoriteList').then((mod) => mod.DeleteFavoriteList),
  { ssr: false }
);
