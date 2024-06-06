import { IResource } from '@/types/resource';
import { BaseDatabaseAdapter, Config } from './BaseDatabaseAdapter';
import { IRedirect } from '@/types/redirect';
import { Session } from 'next-auth';

export class PostgresDatabaseAdapter extends BaseDatabaseAdapter {
  findResourceById(id: string, config: Config): IResource | Promise<IResource> {
    throw new Error('Method not implemented.');
  }
  findRedirectById(id: string): IRedirect | Promise<IRedirect> {
    throw new Error('Method not implemented.');
  }
  addResourceToFavoriteList(body: any, session: Session) {
    throw new Error('Method not implemented.');
  }
  findFavoriteListById(id: string, locale: string, session: Session) {
    throw new Error('Method not implemented.');
  }
  deleteFavoriteListById(id: string, session: Session) {
    throw new Error('Method not implemented.');
  }
  updateFavoriteListById(id: string, body: any, session: Session) {
    throw new Error('Method not implemented.');
  }
  searchForFavoriteLists(query: { [key: string]: any }, session: Session) {
    throw new Error('Method not implemented.');
  }
  findFavoriteLists(session: Session) {
    throw new Error('Method not implemented.');
  }
  createFavoriteList(body: any, session: Session) {
    throw new Error('Method not implemented.');
  }
  removeResourceFromFavoriteList(
    query: { [key: string]: any },
    session: Session,
  ) {
    throw new Error('Method not implemented.');
  }
}
