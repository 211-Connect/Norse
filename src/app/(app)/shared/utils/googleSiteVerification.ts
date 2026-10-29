/**
 * Google Search Console ownership verification via the HTML meta tag method
 * (https://support.google.com/webmasters/answer/9008080#meta_tag_verification).
 *
 * The verification token identifies a Google *user*, not a site: the same
 * token verifies every property that user claims. Connect211 verifies every
 * tenant's branded search site with one Google account, so a single
 * deployment-wide token is rendered on every tenant's `<head>`. Tenants that
 * want their own Search Console access are added as users or delegated
 * owners from Search Console; nothing on the site has to change for that.
 *
 * Several tokens may be given, comma-separated, if more than one Google user
 * needs to verify (e.g. during a hand-over between accounts).
 *
 * Returns the token list for Next's `metadata.verification.google`, or
 * `undefined` so the tag is omitted entirely when nothing is configured.
 * Keep the tag in place after verification succeeds: Google re-checks it
 * periodically and revokes ownership when it disappears.
 */
export function getGoogleSiteVerification(
  raw: string | undefined = process.env.GOOGLE_SITE_VERIFICATION,
): string[] | undefined {
  const tokens = (raw ?? '')
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  return tokens.length > 0 ? tokens : undefined;
}
