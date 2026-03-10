import Script from 'next/script';

export function UmamiScript({
  scriptUrl,
  websiteId,
  nonce,
}: {
  scriptUrl?: string;
  websiteId?: string;
  nonce?: string;
}) {
  if (!scriptUrl || !websiteId) return null;

  return (
    <Script
      id="umami-script"
      src={scriptUrl}
      data-website-id={websiteId}
      nonce={nonce}
      defer
      async
    />
  );
}
