import Script from 'next/script';
import { NEXT_PUBLIC_GTM_CONTAINER_ID } from '../constants/env';

export function GoogleTagManagerScript() {
  if (!NEXT_PUBLIC_GTM_CONTAINER_ID) return null;

  return (
    <>
      <Script id="google-tag-manager-script">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer', '${NEXT_PUBLIC_GTM_CONTAINER_ID}');`}
      </Script>
      <noscript
        dangerouslySetInnerHTML={{
          __html: `<iframe
                title="google-tag-manager"
                src="https://www.googletagmanager.com/ns.html?id=${NEXT_PUBLIC_GTM_CONTAINER_ID}"}
                height="0"
                width="0"
                style="display:none;visibility:hidden"
              ></iframe>`,
        }}
      />
    </>
  );
}
