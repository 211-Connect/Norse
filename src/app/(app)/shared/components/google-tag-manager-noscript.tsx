/**
 * Google's stock GTM `<noscript>` snippet. Rendered as the first child of
 * `<body>` because Search Console's GTM ownership verification reads it from
 * the server HTML without running JavaScript, and fails if it is modified or
 * not at the top of `<body>`. Keep the markup identical to Google's snippet.
 */
export function GoogleTagManagerNoscript({
  containerId,
}: {
  containerId?: string;
}) {
  if (!containerId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}
