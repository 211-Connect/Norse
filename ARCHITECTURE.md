# Cross-system stewardship

Start from the issue and local code. If investigation finds or may find an API
client, endpoint, generated DTO, data pipeline, or authentication boundary,
follow `../architecture-docs/SKILL.md`: discover the actual boundary, then use
the catalog for impact and evidence. Update it when the boundary changes and
run `npm run validate` there. Code, schemas, migrations, and tests remain the
behavioral truth.
