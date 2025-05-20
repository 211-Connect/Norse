import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  COOKIE_TENANT_ID,
  IS_DEVELOPMENT,
  STRAPI_TOKEN,
} from '@/lib/constants';
import { fetchTenants } from '@/lib/server/fetch-tenants';
import { cookies } from 'next/headers';
import { setTenant } from '../actions';

export async function Devtools() {
  if (!IS_DEVELOPMENT || !STRAPI_TOKEN) return null;

  const [{ data: tenants }, cookieStore] = await Promise.all([
    fetchTenants(),
    cookies(),
  ]);

  if (!tenants) {
    console.info('No tenants found in devtools');
    return null;
  }

  const currentTenantId = cookieStore.get(COOKIE_TENANT_ID)?.value;

  return (
    <div className="flex items-center justify-between bg-muted px-2 py-1">
      <h3 className="font-semibold">devtools</h3>

      <Select value={currentTenantId} onValueChange={setTenant}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a tenant" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Tenants</SelectLabel>
            {tenants.map((tenant, key) => (
              <SelectItem key={key} value={tenant.tenantId}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
