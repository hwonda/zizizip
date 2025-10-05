const GoogleAnalytics = () => {
  const googleAnalyticsId = 'G-B7VLCCP4SH';
  const googleAnalyticsSrc = `https://www.googletagmanager.com/gtag/js?id=${ googleAnalyticsId }`;

  return (
    <>
      <script
        async
        src={googleAnalyticsSrc}
      />
      <script
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