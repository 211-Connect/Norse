import { ResourceDirectories } from '..';

export function byTenantId(key: string): string {
  return `${ResourceDirectories.slug}:${key}`;
}
