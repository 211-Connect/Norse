# Printable Directories

## Goal

Printable Directories let authorized users create curated, branded, printable brochures of 211 resources using dynamic section sources (queries, favorites, explicit resource IDs) instead of manually adding one resource at a time.

## Product Scope (MVP)

- Tenant-gated feature via Payload feature flag.
- Tenant access allowlist in Payload (emails + domains).
- Directory definitions persisted in Norse API (NestJS + MongoDB).
- Section source types:
  - saved queries
  - favorites list references
  - explicit resource IDs
- Client-side PDF generation in Norse using existing React-PDF components.
- Localized section/description content with English fallback.

## Why API-first

- Directory content is user-managed operational data, not static CMS content.
- OpenAPI is already the source of truth in this codebase.
- Generated SDK avoids duplicate handwritten request/response types.

## High-Level Architecture

- Payload CMS (tenant config only)
  - `featureFlags.enablePrintableDirectories` (super-admin/support only)
  - `printableDirectories` tab: access mode, allow-lists, user groups (see
    "Access control" below)
- Norse API (directory domain model + CRUD + preview resolution)
- Norse Next.js frontend (list/detail/edit/save-query UX + PDF preview/download/print)

## Data Model (API)

### PrintableDirectory

- `id`
- `tenantId`
- `ownerUserId`
- `name`
- `slug` — public share slug (anyone with it can download the PDF)
- `accessPolicy` — `private | shared-read | shared-edit`, for other signed-in users
- `primaryLanguage` — set at creation, immutable
- `locales` — the languages the directory is offered in, primary always
  included; stored and editable (older directories without a stored list get
  it derived from content)
- `logoUrl` — the directory's logo for header and footer (null: site logo)
- `cover` (title, description, primaryColor, layoutType, optional cover images)
- `header` (layout, text)
- `footer` (layout, text)
- `sections[]`
- `createdAt`, `updatedAt`

Every localized field is `{ values, autoTranslatedLocales }` (see
"Localization & automatic translation").

Resource layout and booklet layout are not stored: they are print-time
choices (ADR 0002).

### PrintableDirectorySection

- `id`
- `directoryId`
- `order`
- `heading`
- `description` (localized)
- `maxResources`
- `sources[]`

### SectionSource

- `id`
- `sectionId`
- `order`
- `type`: `query | favorites_list | resource_ids`
- `query` payload for saved search params and title metadata
- `favoritesListId`
- `resourceIds[]`

## Core Flows

### Directory List

- Route: localized page under app shell.
- Visible only to users with basic access (see "Access control").
- Supports search by directory name and the creation wizard.

### Creation wizard

`CreateDirectoryWizard` (`components/create-directory-wizard.tsx`), titled
"New Printable Directory", two steps:

- **Step 1 — General info**: name, plus the access policy (default
  `private`, each option explained). The access policy is hidden entirely in
  `everyone` access mode, both here and on the detail page.
- **Step 2 — Data** (optional): a "Query" autocomplete (suggestions,
  categories and taxonomies, as in the search dialog; typed text without a
  suggestion becomes a text search) and a "Default location". The query
  creates at most one section with one query source, which has no location
  of its own. The location becomes the directory's `defaultQueryConfig`
  (clearing it to "Everywhere" means none), used by every query source
  without a location — in the PDF (Norse API) and in the source's "Go to
  search results" link (`withDefaultQueryParams()`). No filters and no
  favorites lists here; both are available later.
- The slug is the slugified name. When it is taken, `withUniqueSlugRetry()`
  retries with a random 4-digit suffix.
- `createPrintableDirectory` sets `locales` (every tenant language for users
  with `automaticTranslation`, the primary language otherwise) and applies
  the defaults on the server: cover title = name, header = website + logo +
  date, footer = disclaimer only, in each language from the app's own
  translations. Applying them server-side means they don't need the premium
  capabilities that editing those parts does.
- On success the user lands on the new directory.

The suggestion lists render inline and float over the dialog
(`FLOATING_LISTBOX_CLASSNAME`, `overflow-visible` on the dialog), and
`keepDialogOpenWhileAutocompleteIsOpen` lets the first Escape close an open
list instead of the wizard. Both fields show a loading spinner while
suggestions are on their way.

### Directory Detail

- **General info**: name, Share URL (an uneditable base URL followed by the
  editable slug; a taken slug is reported, not auto-suffixed, because the
  user chose it; with a copy button), languages (checkboxes; the primary
  language is fixed), access policy, default location.
- **Cover**: title and description (basic); front/back images (Cover
  Customization; hidden without it). Primary color and cover layout type are
  hidden until more cover layouts exist.
- **Header / footer**: layout and text (Custom Headers & Footers);
  without it the card shows only the layout. A footer whose only item is
  the disclaimer prints it full-width.
- **Logo** (general info; Logo Upload): one image per directory
  (`logoUrl`), printed wherever the header or footer layout includes "Logo".
  Without one, the site logo is used. Without the capability the logo isn't
  shown or editable.
- **Images**: cover images and the logo are uploaded to the tenant's
  media by `uploadPrintableDirectoryImage` (`kind`: `cover` needs Cover
  Customization, `logo` needs Logo Upload), then saved on the directory
  like any other field. Shared UI: `DirectoryImageField` /
  `DirectoryImageThumbnail`.
- **Sections and sources**: heading, description, max resources (default
  100, always editable); create,
  delete, reorder sources.
- **Clone**: copies the languages and what the user could have authored
  themselves; the header/footer options are hidden without Custom Headers &
  Footers.

### Save Query as Section Source

- On search page, add action next to print button.
- Modal allows:
  - pick/create directory
  - pick/create section
  - save current search params as query source

### Edit Query Source

- From directory section query row, “Edit query” opens search page with context.
- Search page displays disclaimer (“editing printable directory query”).
- Save action updates source query and redirects back to directory.

### PDF Preview / Download / Print

- Resolve fresh resources server-side from API at preview time.
- Transform to existing printable directory PDF view model in Norse.
- Use existing React-PDF rendering path for preview/download/print.
- Template, font size and booklet layout are chosen in the print/share
  dialog. Booklet layout is offered only where the caller supplies
  `postProcessBlob` (printable directories), not in the search, favorites
  or resource print dialogs. Share links carry it as `pdBooklet`.
- Selectable languages are exactly `directory.locales`, for everyone; there
  is no capability check at print time.

## Access control

Tenant-level rules are enforced in Norse, not in the Norse API (ADR 0001).
Per-directory `accessPolicy` is enforced by the API.

1. **Feature flag** — `featureFlags.enablePrintableDirectories`, editable by
   super-admins and support only.
2. **Basic access** — `printableDirectories.accessMode`:
   - `everyone`: every signed-in user of the tenant ("public users");
   - `allowlist`: only `allowedEmails` / `allowedDomains`.
3. **User groups** — `printableDirectories.userGroups`: named groups matched
   by email or domain. A user's capabilities are the union of every group
   they match. Groups only add premium capabilities to basic access.
4. **Capabilities**:

   | Capability | What it unlocks |
   | --- | --- |
   | `coverCustomization` | Cover images (and primary color / layout type) |
   | `customHeadersFooters` | Editing header and footer layout and text |
   | `automaticTranslation` | Machine translation into the directory's languages on save |
   | `logoUpload` | The directory logo (`logoUrl`), used in header and footer |
   | `scheduledPdfDelivery` | Emailing the directory's PDF on a schedule; see [scheduled-pdf-delivery.md](./scheduled-pdf-delivery.md) |

   Basic (always allowed with basic access): name, share URL, languages,
   access policy, default location, cover title and description, sections
   and sources, printing, sharing.

Implementation:

- `canAccessPrintableDirectories.ts` — pure rules for basic access and
  capabilities (`getPrintableDirectoryViewerAccess()`), shared by server and
  client.
- `usePrintableDirectoryAccess()` / `usePrintableDirectoryCapability()` —
  client hooks applying those rules to the session's email; UI gating only.
  Because they run in the browser, the allow-lists and user groups are part
  of the client app config.
- `printableDirectoryServerAccess.ts` — `getPrintableDirectoryServerAccess()`
  is called by every printable directory server action. It returns `null`
  without basic access, or when the client-supplied tenant id doesn't match
  the request host's tenant. `getRequiredUpdateCapabilities()` lists the
  capabilities an update needs; `updatePrintableDirectory` rejects the update
  with `forbidden` if one is missing (`createPrintableDirectory` checks the
  logo too).
- `printableDirectoryMutations.ts` — server-only helpers (no access checks
  of their own) for updates, auto-translation and defaults.
  Kept out of `'use server'` files so they can't be called from the browser.

## Localization & automatic translation

- `primaryLanguage` is the creator's UI language and never changes. Edits
  happen in the primary language.
- **Languages** are a directory setting: `locales`, edited in the general
  info dialog and shown in the general info card. The primary language is
  always included. Printing and sharing offer exactly `locales`.
- `LocalizedFieldTable` has one row per directory language, primary
  first. Collapsed (the default) it shows only the primary language and the
  current UI language; "Show N more languages" expands the rest. There is no
  per-field "add language": the languages are a directory setting.
  - With `automaticTranslation`, empty languages are machine-translated on
    save and marked "Machine translated" until someone edits them.
  - Without it, languages are typed by hand.
- **Provenance** — each localized field carries `autoTranslatedLocales`. The
  API stores exactly what the client sends, so the client maintains it:
  `toLocalizedValues()` keeps it, and the table removes a language from it
  as soon as the user types in that language (it becomes human-edited and
  protected).
- **Auto-translate on save** — for users with `automaticTranslation`,
  `updatePrintableDirectory` (cover, header, footer),
  `createPrintableDirectorySection` and `updatePrintableDirectorySection`
  save first, then translate into every directory language that is missing
  or machine-translated, and write the result in a second update before
  resolving (synchronous; ADR 0003). Changing `locales` translates the whole
  directory, sections included, so added languages get content. Human-edited
  languages are never overwritten. When the primary text is cleared, its
  machine translations are removed. A translation failure never fails the
  save.
- `translationService.batchTranslate()`/`translate()` accept a `sourceLocale`
  (default `'en'`); non-English sources get their own cache key shape.

Known gap: if a user without `automaticTranslation` edits the primary text
of a directory that has machine translations, those translations go stale
until a premium user saves the field again.

## Limits and Safety

- Enforce per-section `maxResources`.
- Enforce directory-level total cap for PDF generation.
- Return partial warnings when source resolution fails for some resources.

## Rollout Plan

1. Payload config fields + app config mapping.
2. NestJS OpenAPI contracts + CRUD + preview resolve endpoint.
3. Regenerate SDK in Norse.
4. Build list/detail/save-query/edit-query flows.
5. Wire preview/download/print using existing PDF components.
6. Add focused tests and tenant-level validation.