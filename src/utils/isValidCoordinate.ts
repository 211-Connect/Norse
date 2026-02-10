export function isValidCoordinate(
  coordinates: number[] | null | undefined,
): coordinates is [number, number] {
  return (
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    !isNaN(coordinates[0]) &&
    !isNaN(coordinates[1]) &&
    // Filter out [0, 0] coordinates
    !(coordinates[0] === 0 && coordinates[1] === 0)
  );
}
