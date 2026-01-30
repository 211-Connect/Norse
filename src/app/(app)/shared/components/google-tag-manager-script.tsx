import Script from 'next/script';

export function GoogleTagManagerScript({
  containerId,
  nonce,
}: {
  containerId?: string;
  nonce?: string;
}) {
  if (!containerId) return null;

  return (
    <>
      <Script id="google-tag-manager-script" nonce={nonce}>
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer', '${containerId}');`}
      </Script>
      <noscript
        dangerouslySetInnerHTML={{
          __html: `<iframe
                title="google-tag-manager"
                src="https://www.googletagmanager.com/ns.html?id=${containerId}"}
                height="0"
                width="0"
                style="display:none;visibility:hidden"
              ></iframe>`,
        }}
      />
    </>
  );
}
