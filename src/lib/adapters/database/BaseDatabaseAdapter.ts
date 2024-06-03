import { IRedirect } from '@/types/redirect';
import { IResource } from '@/types/resource';
import { NextApiRequest } from 'next';
import { Session } from 'next-auth';

export type Config = {
  locale: string;
};

export abstract class BaseDatabaseAdapter {
  notFound = '404';
  conflict = '409';

  abstract findResourceById(
    id: string,
    config: Config,
  ): IResource | Promise<IResource>;

  abstract findRedirectById(id: string): IRedirect | Promise<IRedirect>;

  abstract addResourceToFavoriteList(
    body: NextApiRequest['body'],
    session: Session,
  );

  abstract findFavoriteListById(id: string, locale: string, session: Session);

  abstract deleteFavoriteListById(id: string, session: Session);

  abstract updateFavoriteListById(
    id: string,
    body: NextApiRequest['body'],
    session: Session,
  );

  abstract searchForFavoriteLists(
    query: { [key: string]: any },
    session: Session,
  );

  abstract findFavoriteLists(session: Session);

  abstract createFavoriteList(body: NextApiRequest['body'], session: Session);

  abstract removeResourceFromFavoriteList(
    query: { [key: string]: any },
    session: Session,
  );
}
