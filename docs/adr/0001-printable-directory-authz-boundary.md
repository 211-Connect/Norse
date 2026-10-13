# Printable directory authorization is authoritative in Norse, not the Norse API

Today, printable-directory access control (tenant feature flag + email/domain
allow-list, `canAccessPrintableDirectories.ts`) is only checked at 6 of
roughly 18 relevant call sites in Norse; the rest forward straight to the
Norse API, which may or may not enforce anything equivalent — this repo
cannot see or control that. We are adding tenant-customizable Printable
Directory User Groups and capability-based permissions (logo upload, cover
customization, custom headers/footers, automatic translation, scheduled PDF
delivery) on top of this.

We decided that Norse (this repo) is the sole authoritative enforcer of all
printable-directory tenant-level access and capability rules — feature flag,
access mode, allow-lists, user groups, and capabilities. The Norse API is not
expected to re-validate these; every relevant server action in this repo must
perform the check itself (closing the current gap), rather than splitting or
duplicating this logic across both services. Group/capability configuration
already lives in Payload, in this repo, alongside the existing flag/allowlist
fields — evaluating it here avoids a second, separately-maintained copy of
the same rules in a service that doesn't own the config.

This ADR covers tenant-level feature/capability access only. Per-directory
ownership/sharing (`accessPolicy`: private/shared-read/shared-edit) is a
separate concern the Norse API already validates and is unaffected.
