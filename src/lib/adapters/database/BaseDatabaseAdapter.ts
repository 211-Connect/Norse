import { IRedirect } from '@/types/redirect';
import { IResource } from '@/types/resource';

export type Config = {
  locale: string;
};

export abstract class BaseDatabaseAdapter {
  notFound = '404';

  abstract findResourceById(
    id: string,
    config: Config,
  ): IResource | Promise<IResource>;

  abstract findRedirectById(id: string): IRedirect | Promise<IRedirect>;
}
