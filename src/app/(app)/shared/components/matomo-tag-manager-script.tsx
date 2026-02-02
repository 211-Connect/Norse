import Script from 'next/script';

export function MatomoTagManagerScript({
  matamoContainerUrl,
  nonce,
}: {
  matamoContainerUrl?: string;
  nonce?: string;
}) {
  if (!matamoContainerUrl) return null;

  return (
    <>
      <Script id="matomo-tag-manager-script" nonce={nonce}>
        {`var _mtm = window._mtm = window._mtm || [];
        _mtm.push({'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start'});
        (function() {
          var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
          g.async=true; g.src='${matamoContainerUrl}'; s.parentNode.insertBefore(g,s);
        })();`}
      </Script>
    </>
  );
}
