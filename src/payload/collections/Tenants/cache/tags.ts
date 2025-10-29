import { Tenants } from '..';

export function byTenantId(key: string): string {
  return `${Tenants.slug}:${key}`;
}

export function byDomain(key: string): string {
  return `${Tenants.slug}:${key}`;
}
