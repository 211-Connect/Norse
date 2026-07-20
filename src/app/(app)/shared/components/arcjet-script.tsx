import Script from 'next/script';

export function ArcjetScript({
  scriptUrl,
  nonce,
}: {
  scriptUrl?: string;
  nonce?: string;
}) {
  if (!scriptUrl) {
    return null;
  }
  return (
    <Script
      id="arcjet-signals"
      src={scriptUrl}
      strategy="afterInteractive"
      nonce={nonce}
    />
  );
}
