/** The no-dial test mode is on only when the env value is exactly "true". Default off. */
export function noDialEnabled(value: string | undefined): boolean {
  return value === 'true';
}
