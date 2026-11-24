import type { UIFieldServerProps } from 'payload';

import { listPageAddresses } from '@/payload/services/landingPagesAdmin';

import './LandingCopyFields.css';

const idOf = (value: unknown) =>
  value && typeof value === 'object' && 'id' in value
    ? String((value as { id: unknown }).id)
    : value
      ? String(value)
      : null;

/**
 * Page editor: the current address in every locale with an Open link, and
 * the old addresses that redirect here.
 */
export default async function LandingPageAddressesField({
  data,
  payload,
}: UIFieldServerProps) {
  const tenantId = idOf(data?.tenant);
  if (!data?.id || !tenantId) return null;
  const addresses =
    (await listPageAddresses(payload, tenantId, [data.id])).get(
      String(data.id),
    ) ?? [];
  const current = addresses.filter((a) => a.current);
  const old = addresses.filter((a) => !a.current);

  return (
    <div className="landing-addresses">
      <p className="landing-addresses__label">Addresses</p>
      {current.length === 0 ? (
        <p>None yet. Addresses are created by Apply changes.</p>
      ) : (
        <table>
          <tbody>
            {current.map((address) => (
              <tr key={address.locale}>
                <th scope="row">{address.locale}</th>
                <td>/{address.path}</td>
                <td>
                  <a href={address.href} target="_blank" rel="noreferrer">
                    Open page
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {old.length > 0 && (
        <details>
          <summary>
            {old.length} old{' '}
            {old.length === 1 ? 'address redirects' : 'addresses redirect'} here
          </summary>
          <ul>
            {old.map((address) => (
              <li key={`${address.locale}/${address.path}`}>
                {address.locale}: /{address.path}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
