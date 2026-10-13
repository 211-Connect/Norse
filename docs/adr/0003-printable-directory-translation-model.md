# Printable directory translation: synchronous, capability-gated, with per-field-per-locale provenance

Automatic translation must (a) only run for users holding the Automatic
Translation capability, (b) never silently overwrite a value a human has
already edited, and (c) not depend on Payload's existing `translate` job —
that job is hard-wired to the `resource-directories` Payload collection, and
printable directories aren't a Payload collection at all; their data lives
entirely in the Norse API.

We decided: both the existing manual "Translate this field" action and the
new auto-translate-on-save cascade are gated by the same Automatic
Translation capability (this changes the manual action from unrestricted to
capability-gated). Translation runs synchronously inside the save request —
call the translation provider for every target locale not already
human-protected, then write the results back to the Norse API, all before
the save request resolves — rather than as an async/background job. The
Norse API gains per-localized-field, per-locale provenance tracking
(machine-translated vs. human-edited) so automatic translation can tell
which values are safe to overwrite.

We chose synchronous execution over a background job to avoid building new
async job infrastructure for an entity Payload doesn't manage, accepting
longer save-request latency (proportional to the tenant's locale count) as
the explicit trade-off. We chose per-field-per-locale provenance granularity
because a directory can simultaneously have most locales/fields on
auto-translation while one specific field in one specific locale has been
manually corrected — anything coarser (per-locale or per-directory) can't
represent that.

Provenance is stored by the Norse API exactly as the client sends it
(`autoTranslatedLocales` on every localized value). The client therefore owns
keeping it correct: it must send the list back unchanged, drop a locale from
it when a human edits that locale, and add a locale when it fills it with a
machine translation. Machine translation targets the directory's own
`locales` (a stored, user-chosen setting), not every tenant locale; the
one-click "Translate this field" action was removed.
