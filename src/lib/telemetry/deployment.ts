/**
 * Which App Platform app this process belongs to: the multi-tenant apps or
 * MBOA's. Both run the same services (`norse-app`, `norse-cms`) under the
 * same names, so this is what tells them apart. Unset means `multi-tenant`;
 * an unusable value is reported as `unknown` (it becomes a Prometheus and
 * Loki label, so it must stay a short slug).
 */
export function norseDeployment(
  raw: string | undefined = process.env.NORSE_DEPLOYMENT,
): string {
  const value = raw?.trim().toLowerCase();
  if (!value) return 'multi-tenant';
  return /^[a-z0-9][a-z0-9-]{0,31}$/.test(value) ? value : 'unknown';
}
