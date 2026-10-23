/**
 * Google's stock GTM loader snippet, rendered as a plain inline `<script>`
 * inside `<head>` so it is present in the server HTML. Search Console's GTM
 * ownership verification reads the raw HTML without running JavaScript and
 * fails ("snippet in the wrong location") if the snippet is only injected
 * client-side (as `next/script` does) or sits outside `<head>`.
 *
 * The only addition to Google's snippet is the `nonce` so the dynamically
 * created gtm.js tag passes our `strict-dynamic` CSP.
 */
export function GoogleTagManagerScript({
  containerId,
  nonce,
}: {
  containerId?: string;
  nonce?: string;
}) {
  if (!containerId) return null;

  const nonceAssignment = nonce ? `j.nonce='${nonce}';` : '';

  return (
    // The lint rule wants `@next/third-parties` / `next/script`, but those
    // inject the snippet client-side, which is exactly what verification
    // cannot see. A plain server-rendered <script> is intentional here.
    // eslint-disable-next-line @next/next/next-script-for-ga
    <script
      id="google-tag-manager-script"
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;${nonceAssignment}f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');`,
      }}
    />
  );
}
