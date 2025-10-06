import { siteMetadata } from '@/constants/metadata';

export default function StructuredData() {
  return (
    <script
      type='application/ld+json'
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
