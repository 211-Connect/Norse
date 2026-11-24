/**
 * Google's GTM `<noscript>` snippet, rendered as the first child of `<body>`
 * where Google expects it.
 *
 * The iframe carries an empty `sandbox` (every restriction on): security
 * scanners flag an unsandboxed third-party frame (Acunetix "Insecure Frame
 * (External)", ISS-2876). `ns.html` only loads tracking pixels, which still
 * load in a sandboxed frame. Search Console ownership is proven with the
 * `google-site-verification` meta tag (see `googleSiteVerification.ts`), not
 * with this snippet, so the deviation from Google's stock markup is safe.
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
        sandbox=""
      />
    </noscript>
  );
}
