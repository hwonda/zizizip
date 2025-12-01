import Script from 'next/script';

const GoogleAnalytics = () => {
  const googleAnalyticsId = 'G-B7VLCCP4SH';
  const googleAnalyticsSrc = `https://www.googletagmanager.com/gtag/js?id=${ googleAnalyticsId }`;

  return (
    <>
      <Script
        id="google-analytics-src"
        src={googleAnalyticsSrc}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${ googleAnalyticsId }');
          `,
        }}
      />
    </>
  );
};

export default GoogleAnalytics;