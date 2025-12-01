import Script from 'next/script';
import { siteMetadata } from '@/constants/metadata';

export default function StructuredData() {
  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          'name': '지지집',
          'url': siteMetadata.url,
          'alternateName': 'ZIZIZIP',
        }),
      }}
    />
  );
}
