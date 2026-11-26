# Custom header and footer menus

Tenants can add their own links to the site header and footer: a "Main
site" link, a feedback form, "Call 211", a funding disclaimer and so on.

## Where it is configured

Payload → Resource Directory → **Header** tab → _Menu Items_, and **Footer**
tab → _Menu Items_. Both use the same field, `customMenuField`
(`src/payload/fields/customMenuField.ts`).

Each item has a name, a URL (`href`) and "Open in new window/tab".

## Shared links, translated names

The list of items, their order, URLs and new-tab settings are the same in
every locale. Only `name` is localized.

- The English name is required. Other locales may leave it blank.
- A blank name shows the English one. `withMenuNameFallback`
  (`src/app/(app)/shared/utils/customMenu.ts`) does this in `buildAppConfig`,
  using the English directory it already loads for other fallbacks. Payload's
  own locale fallback stays off (`fallback: false`).
- Changing an English name queues the auto-translation job like other
  localized texts: `getChangedLocalizedPaths` reports
  `header.customMenu.<n>.name` / `footer.customMenu.<n>.name`, the
  `autoTranslate` hook passes the item ids, and the `translate` job fills each
  locale's name. A name it cannot translate stays blank (English is shown).

A tenant cannot show a link in one language only, or point one item at a
different URL per language.

## History

Until migration `20261126_130612_custom_menu_shared_links` the whole array was
localized: each locale had its own list, and a locale with no list showed no
menu (for example Contra Costa Crisis Center had 3 English links and none in
Spanish). The migration merged each directory's per-locale lists into one,
matching items by URL, kept every locale's name, and kept the English item's
order and new-tab setting. Links that existed only in other locales were
added for English too, with another locale's name (Spanish first) as the
English name; edit those in the CMS. Its `down` turns each locale's name back
into its own row.
