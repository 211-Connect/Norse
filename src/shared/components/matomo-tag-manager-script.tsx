import Script from 'next/script';
import { MATOMO_CONTAINER_URL } from '../lib/constants';

export function MatomoTagManagerScript() {
  if (!MATOMO_CONTAINER_URL) return null;

  return (
    <>
      <Script id="matomo-tag-manager-script">
        {`var _mtm = window._mtm = window._mtm || [];
        _mtm.push({'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start'});
        (function() {
          var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
          g.async=true; g.src='${MATOMO_CONTAINER_URL}'; s.parentNode.insertBefore(g,s);
        })();`}
      </Script>
    </>
  );
}
