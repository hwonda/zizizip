import type { Metadata } from 'next';
import { mapPageMetadata } from '@/constants/metadata';
import MapPageClient from '@/components/map/MapPageClient';

export function generateMetadata(): Metadata {
  return {
    title: mapPageMetadata.title,
    description: mapPageMetadata.description,
    alternates: {
      canonical: mapPageMetadata.url,
    },
    openGraph: {
      title: mapPageMetadata.title,
      description: mapPageMetadata.description,
      url: mapPageMetadata.url,
      siteName: mapPageMetadata.title,
      locale: 'ko_KR',
      type: 'website',
      images: [
        {
          url: mapPageMetadata.thumbnailURL,
          width: 1200,
          height: 630,
          alt: mapPageMetadata.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: mapPageMetadata.title,
      description: mapPageMetadata.description,
      images: [mapPageMetadata.thumbnailURL],
    },
  };
}

export default function MapPage() {
  return <MapPageClient />;
}