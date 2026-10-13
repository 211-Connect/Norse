# Delete resourceLayout, isBookletLayout, and the custom-search/custom-resource discriminator

`resourceLayout` and `isBookletLayout` are persisted on every printable
directory today, but only ever affect client-side PDF rendering (which
React-PDF template to use, and whether to post-process the generated blob
for booklet printing) — neither is sent to or used by the Norse API's preview
endpoint. `resourceLayout` also doubled as a discriminator: the values
`custom-search`/`custom-resource` (never offered by the creation UI, origin
unknown) hide the Print and Share buttons entirely for a directory, with no
identified remaining consumer of that behavior.

We decided to delete both fields, and the custom-search/custom-resource
discriminator, from the Norse API schema/DTOs and data model entirely, rather
than deprecate them or keep them for backward compatibility. Resource layout
and booklet layout become ephemeral, print-time-only choices made in the
Next.js print dialog and never persisted anywhere.

We chose simplicity now over preserving unused optionality. If a "custom,
unprintable/unshareable directory" concept is needed again later, it should
be reintroduced deliberately with a clear purpose, not carried forward as
dead weight indefinitely.
