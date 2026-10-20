# Translation usage

Printable directory automatic translation (the `automaticTranslation`
capability; see [printable-directories.md](./printable-directories.md)) calls
Google Cloud Translation, which Connect211 pays for. A user could use
directory fields as a free general-purpose translator, so usage is metered
per tenant and user, capped monthly, and alerted on.

Only printable directory auto-translation is metered. The Payload
`translate` / `translateTopics` jobs use the same `translationService` but
are not tracked.

## What is measured

Google bills **source characters, once per target language**. Whitespace
counts, and so does each target language. Tokens and words are not
relevant. Usage is therefore tracked in **billed characters**:

- **Billed characters**: the code-point length of each text that missed the
  Redis translation cache, times the number of languages it was translated
  into.
- **Requested characters**: billed characters plus cache hits. Cache hits
  are free; the gap between the two shows how often users re-save
  unchanged text.
- **Saves**: saves that machine-translated anything.
- **Largest field**: the longest source text. Few saves with very large
  fields is what "using it as a translator" looks like.
- **Languages**: the target locales used.

Cost is an estimate: `billed characters / 1,000,000 × price`. It uses
list price and ignores Google's free tier, which applies to the whole
billing account. The translation cache is shared by all tenants, so
whoever translates a text first is billed for it.

`createTranslationMeter()` (`shared/services/translation-usage/translation-meter.ts`)
collects one save's usage from the `BatchTranslationResult`s that
`autoTranslatePrintableDirectoryText()` gets back from `batchTranslate()`.

## Limits

All limits are monthly (UTC calendar month) and in estimated USD.

| Limit | Default | Effect |
| --- | --- | --- |
| Alert threshold | $10 | Emails every `super-admin` and `support` user, once per tenant per month |
| Per-user quota | $10 | That user's saves are no longer machine-translated |
| Tenant hard cap | $25 | No saves in the tenant are machine-translated |

- **Defaults** are hardcoded in `DEFAULT_TRANSLATION_USAGE_LIMITS`
  (`shared/services/translation-usage/translation-usage-limits.ts`), with the
  price of USD 20 per million characters.
- **Per-tenant overrides** are in Payload: Resource Directory →
  Printable Directories → **Automatic Translation Limits**
  (`printableDirectories.translation.*`). Only super-admins and support can
  read or edit them. Leave a field empty to use the default. To lift a
  limit mid-month, raise it here.
- **A reached limit never fails a save**, consistent with ADR 0003. The save
  succeeds untranslated, and the directory detail page shows a notice to
  users with `automaticTranslation` (`auto_translate_paused_*` strings).
- **Limits are checked before translating**, so one save can overshoot a
  limit by its own size. The Norse API's field length limits keep that
  small (see below).
- If the usage check itself fails, translation is allowed (fail open).

## Field length limits

Every value of a localized field is capped in the Norse API
(`MaxLocalizedValueLength` in
`src/printable-directory/dto/common/max-localized-value-length.validator.ts`):

- 200 characters for cover titles and section headings;
- 2,000 characters for descriptions and header/footer text.

The Norse inputs match (`DIRECTORY_SHORT_TEXT_MAX_LENGTH` /
`DIRECTORY_LONG_TEXT_MAX_LENGTH` in
`features/printable-directories/utils/constants.ts`, applied by
`LocalizedFieldTable` according to `multiline`).

## Architecture

- `runMeteredTranslation(context, translate)`
  (`shared/services/translation-usage/translation-usage-service.ts`) wraps
  every auto-translation in `updatePrintableDirectoryContent`,
  `createPrintableDirectorySection` and `updatePrintableDirectorySection`:
  1. `getTranslationAllowance()` checks the user's and tenant's month
     totals against the limits. If one is reached, it returns
     `{ skipped: true }`.
  2. Otherwise it runs `translate` with a meter.
  3. It records the usage in `after()`, so recording never delays or fails
     the save. Usage is also recorded when translation throws, because
     calls that reached Google are billed anyway.
- `getTranslationUsageContext(access)` supplies tenant id, tenant name and
  the user's email. `PrintableDirectoryServerAccess.userEmail` carries the
  session email.

### Storage (Payload, Postgres)

- `translation-usage`: one row per (tenant, month, email), unique index.
  Writes are one raw `INSERT … ON CONFLICT DO UPDATE` through
  `payload.db.drizzle`, which increments atomically even when saves run
  concurrently. Payload's local API has no atomic increment.
- `translation-usage-alerts`: one row per (tenant, month), unique index.
  The alert is inserted with `ON CONFLICT DO NOTHING RETURNING`, and only
  the request whose insert succeeds sends the email.

Both collections are hidden from the nav and read-only through Payload:
read is super-admin/support, and create/update/delete are denied. No
per-call event log is kept.

### Alert email

`sendTranslationUsageAlertEmail()` sends one email through Payload's email
adapter (SendGrid) to every user with the `super-admin` or `support` role,
all bcc'd. It contains the tenant, the month's estimated total and the top
5 users.

### Admin table

The `translationUsage` UI field in the Printable Directories tab renders
`TranslationUsageTable`, a client component. It shows:

- a month picker covering the last 12 months;
- the tenant total against the hard cap, with the alert threshold marked;
- when the alert was sent;
- one row per user, flagged when they reached their quota.

It renders only for super-admins and support. It reads the two collections
through the REST API, whose read access enforces the same rule.
