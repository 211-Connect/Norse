/**
 * Ensures a URL has a protocol (http:// or https://)
 * If the URL already has a protocol, it returns it as-is
 * If the URL doesn't have a protocol, it adds https://
 *
 * @param url - The URL to normalize
 * @returns The URL with a protocol, or null if input is null/undefined
 *
 * @example
 * ensureUrlProtocol('www.example.com') // 'https://www.example.com'
 * ensureUrlProtocol('https://www.example.com') // 'https://www.example.com'
 * ensureUrlProtocol('http://www.example.com') // 'http://www.example.com'
 */
export function ensureUrlProtocol(
  url: string | null | undefined,
): string | null {
  if (!url) {
    return null;
  }

  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return null;
  }

  // Check if URL already has a protocol
  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  // Add https:// as default protocol
  return `https://${trimmedUrl}`;
}
