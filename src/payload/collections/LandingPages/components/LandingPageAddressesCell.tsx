import type { DefaultServerCellComponentProps } from 'payload';

import { listPageAddresses } from '@/payload/services/landingPagesAdmin';

const idOf = (value: unknown) =>
  value && typeof value === 'object' && 'id' in value
    ? String((value as { id: unknown }).id)
    : String(value);

/** Page list column: the page's current address in the default locale. */
export default async function LandingPageAddressesCell({
  rowData,
  payload,
}: DefaultServerCellComponentProps) {
  if (!rowData?.id || !rowData.tenant) return null;
  const addresses = await listPageAddresses(payload, idOf(rowData.tenant), [
    rowData.id as number,
  ]);
  const current = (addresses.get(String(rowData.id)) ?? []).filter(
    (a) => a.current,
  );
  const first = current[0];
  if (!first) return <span>—</span>;
  return (
    <span>
      <a href={first.href} target="_blank" rel="noreferrer">
        /{first.path}
      </a>
      {current.length > 1 && (
        <span title={current.map((a) => a.locale).join(', ')}>
          {' '}
          · {current.length} languages
        </span>
      )}
    </span>
  );
}
