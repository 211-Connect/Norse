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
  - `featureFlags.enablePrintableDirectories`
  - `printableDirectories.allowedEmails[]`
  - `printableDirectories.allowedDomains[]`
- Norse API (directory domain model + CRUD + preview resolution)
- Norse Next.js frontend (list/detail/edit/save-query UX + PDF preview/download/print)

## Data Model (API)

### PrintableDirectory

- `id`
- `tenantId`
- `ownerUserId`
- `name`
- `cover` (title, description, primaryColor, layoutType, optional coverImage)
- `header` (layout, text, optional logo, website/date toggles)
- `footer` (layout, text, optional logo, website/date toggles)
- `resourceLayout` (preset/custom)
- `isBookletLayout` (boolean, default `false`) — when enabled, printed/exported output is formatted for booklet printing by padding the total page count to a multiple of four, inserting blank pages after the cover and/or before the back cover as needed so the cover stays page 1 and the back cover stays the last page.
- `sections[]`
- `createdAt`, `updatedAt`

### PrintableDirectorySection

- `id`
- `directoryId`
- `order`
- `heading`
- `description` (localized, English fallback)
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
- Visible only when:
  - feature flag enabled
  - current user email matches allowlist email or domain
- Supports:
  - search by directory name
  - pagination
  - add directory modal (name only)

### Directory Detail

- Editable settings:
  - name
  - cover
  - header
  - footer
  - resource layout
  - booklet layout (boolean toggle)
  - sections and ordering
- Section editing:
  - heading, description, max resources
  - create/delete/reorder sources

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

## Localization

- User-authored section descriptions support localization.
- English fallback when active locale value is missing.
- PDF labels/date formatting should use active locale.

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