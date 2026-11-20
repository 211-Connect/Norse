/** The tenant hero photo url, or null when the tenant has none (the page then shows the gradient). */
export function heroImageSrc(
  heroUrl: string | null | undefined,
): string | null {
  const src = heroUrl?.trim();
  return src ? src : null;
}
