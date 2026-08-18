---
sidebar_position: 5
---

# Custom Attributes

Custom Attributes let a tenant add an arbitrary `Datum` (icon + title/subtitle/description + optional link)
to a resource page or a search result card, driven entirely from the Payload admin UI — no code changes
required. This is how tenants can surface data that doesn't have a dedicated layout component (e.g. a
tenant-specific field, a static call-to-action, or a value pulled from `attributeValues`).

## Where it's configured

Custom Attributes are one of the selectable items inside the **Layout** editors in the Payload admin:

- **Resource page layout**: ResourceDirectories → Resource tab → `Left Column Groups` / `Right Column Groups`
  ([src/payload/collections/ResourceDirectories/tabs/resource.ts](/src/payload/collections/ResourceDirectories/tabs/resource.ts))
- **Search result card layout**: ResourceDirectories → Search tab → `Card Layout`
  ([src/payload/collections/ResourceDirectories/tabs/search.ts](/src/payload/collections/ResourceDirectories/tabs/search.ts))

Both layout editors are arrays of `{ componentId, customAttribute }` rows. When a row's `componentId` is
set to `customAttribute` (`ResourceComponentId.CUSTOM_ATTRIBUTE` / `SearchCardComponentId.CUSTOM_ATTRIBUTE`),
a `customAttribute` group field appears, defined by
[customAttributeFields](/src/payload/collections/ResourceDirectories/fields/customAttributeFields.ts):

| Field        | Type   | Notes                                                              |
| ------------ | ------ | ------------------------------------------------------------------- |
| `title`      | text   | Localized                                                          |
| `subtitle`   | text   | Localized                                                          |
| `description`| text   | Localized                                                          |
| `icon`       | text   | Picked via `IconPicker`; must be one of `SUPPORTED_ICONS` ([src/utils/supportedIcons.ts](/src/utils/supportedIcons.ts)) |
| `iconColor`  | text   | Picked via `ColorPicker`, e.g. a Tailwind color class               |
| `size`       | select | `sm` (default) or `md`                                             |
| `titleBelow` | checkbox | Renders the title below the description instead of above         |
| `url`        | text   | Optional link target                                               |
| `urlTarget`  | select | `_self` (default) or `_blank`                                      |

## Interpolation

`title`, `subtitle`, `description`, and `url` support `{{ propertyPath }}` placeholders that are
resolved against the current resource/result object at render time, via
[interpolateResourceProperties](/src/utils/interpolateResourceProperties.ts):

```
{{ name }}
{{ attributeValues.someCustomField }}
```

`propertyPath` is resolved with `radash`'s `get()`, so dot-notation works for nested values (e.g. values
stored under `attributeValues`). If any interpolated field still contains an unresolved `{{ ... }}` after
substitution, the whole Custom Attribute is treated as invalid and does not render (this prevents leaking
raw template syntax to end users when the referenced property is missing).

## Rendering

The rendering logic lives in
[CustomAttributeComponent](/src/app/(app)/features/resource/components/resource-components/custom-attribute.tsx)
and is shared by both surfaces:

- Resource page: rendered directly via the resource `component-registry`.
- Search result card: [search-card-components/custom-attribute.tsx](/src/app/(app)/features/search/components/search-card-components/custom-attribute.tsx)
  delegates to the same resource `CustomAttributeComponent`, passing the search `result` in place of a
  `resource` (both accept `Resource | ResultType`).

`getCustomAttributeProps` (wrapped in React's `cache()`) computes the interpolated `title`/`subtitle`/
`description`/`url` and returns `null` when there's nothing to show (all three of title/subtitle/description
are empty, or a placeholder failed to resolve). The component then renders a `Datum` with the icon resolved
via `useIconComponent`.

## Adding a new built-in layout component instead

If the data is available on every tenant (not tenant-specific ad-hoc content), prefer adding a real
component instead of relying on Custom Attributes:

1. Add an id to `ResourceComponentId` ([src/app/(app)/features/resource/types/component-ids.ts](/src/app/(app)/features/resource/types/component-ids.ts))
   and/or `SearchCardComponentId` ([src/app/(app)/features/search/types/card-component-ids.ts](/src/app/(app)/features/search/types/card-component-ids.ts)).
2. Add the field(s) to `Resource` and/or `ResultType` typings if the data isn't already exposed.
3. Create the component under `resource-components/` (and a thin delegating wrapper under
   `search-card-components/` if it should also appear on search cards), following the pattern used by
   `EligibilityComponent`/`HoursComponent`/`ApplicationProcessComponent` (accept `Resource | ResultType`).
4. Register the component + its `shouldComponentRender`/`shouldSearchCardComponentRender` visibility rule
   in `component-registry.tsx` / `card-component-registry.tsx`.
5. Add a label for it in `COMPONENT_LABELS` in
   [ResourceLayoutRowLabel.tsx](/src/payload/collections/ResourceDirectories/components/ResourceLayoutRowLabel.tsx)
   if it isn't automatically titleized correctly.

The enum options automatically show up as selectable items in both layout editors since the Payload
`select` options are generated from `Object.values(ResourceComponentId)` / `Object.values(SearchCardComponentId)`.
