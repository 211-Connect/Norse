export function validateCoordsString(coordsStr?: string | null): boolean {
  if (!coordsStr) {
    return true;
  }

  const splittedCoords = coordsStr.split(',');
  if (splittedCoords.length !== 2) {
    return false;
  }

  const [lon, lat] = splittedCoords;
  const numberRegex = /^-?\d+(\.\d+)?$/;

  if (!numberRegex.test(lon) || !numberRegex.test(lat)) return false;

  return true;
}
