const UUID_V4_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function isValidUUID(id: string): boolean {
  if (id.length !== 36) {
    return false;
  }

  return UUID_V4_REGEX.test(id);
}
