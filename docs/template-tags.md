# Template tags in CMS content

Tenant admins can write `{name}`, `{phone}` and `{email}` in any text they
configure in Payload (Privacy Policy, Terms of Use and Accessibility page
content, footer disclaimer and copyright, meta title, menus, alerts, …). The
public site shows the tenant's own values in their place, so one shared text
(for example a privacy policy template) works for every client.

## Tags

| Tag       | Replaced with                       | Configured in (Settings → tab) |
| --------- | ----------------------------------- | ------------------------------ |
| `{name}`  | The directory name (`brand.name`)   | Name field above the tabs      |
| `{phone}` | Phone number (`contact.number`)     | Brand → Phone Number           |
| `{email}` | Contact email (`contact.email`)     | Brand → Email                  |

- Phone and email are optional. A tag with no value is replaced with an empty
  string, so check the page after using `{phone}` or `{email}`.
- Tags are case-sensitive and must be written exactly as above. Unknown tags
  (`{website_owner}`) are left as typed.
- Double braces are left alone: `{{name}}` is i18next interpolation, not a
  template tag.
- Values are inserted as typed, without HTML escaping. They come from the same
  tenant admins who write the raw HTML page content.

## How it works

`buildAppConfig` (`src/app/(app)/shared/utils/buildAppConfig.ts`) builds the
tenant's `AppConfig` from its `ResourceDirectory`, then runs
`applyTemplateTags` (`src/app/(app)/shared/utils/applyTemplateTags.ts`) over
the whole result. It walks plain objects and arrays and replaces tags in every
string. This runs once per config build in the CMS, and the result is cached
like the rest of the config, so pages pay nothing per request.

Only text read through `AppConfig` is covered. Code that reads the
`ResourceDirectory` document directly (for example Keycloak branding sync)
sees the raw tags.

Admin help text on the long-form fields comes from
`TEMPLATE_TAGS_DESCRIPTION`
(`src/payload/collections/ResourceDirectories/templateTagsDescription.ts`).

## Adding a tag

1. Add its name to `TEMPLATE_TAGS` in `applyTemplateTags.ts`.
2. Pass its value in the `applyTemplateTags` call at the end of
   `buildAppConfig`.
3. Update `TEMPLATE_TAGS_DESCRIPTION` and the table above.
