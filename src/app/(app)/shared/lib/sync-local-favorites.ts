/**
 * syncLocalFavoritesToAccount
 *
 * After a successful login, this function should:
 * 1. Read the local-favorites list from localStorage.
 * 2. Call the API to find or create a matching favorite list under the account.
 * 3. Remove the local-favorites key from localStorage on success.
 *
 * TODO: Implement once the backend "find-or-create list" endpoint is available. (ISS-909)
 */
export async function syncLocalFavoritesToAccount(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(
    '[TODO] syncLocalFavoritesToAccount: merge local favorites into account after login.',
  );
}
