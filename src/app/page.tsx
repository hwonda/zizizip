import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { siteMetadata } from '@/constants/metadata';

export const metadata: Metadata = {
  title: siteMetadata.title,
  description: siteMetadata.description,
  alternates: {
    canonical: siteMetadata.url,
  },
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: siteMetadata.url,
    siteName: siteMetadata.title,
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: siteMetadata.thumbnailURL,
        width: 1200,
        height: 630,
        alt: siteMetadata.title,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteMetadata.title,
    description: siteMetadata.description,
    images: [siteMetadata.thumbnailURL],
  },
};

export default function Home() {
  // 홈 페이지 접속 시 대시보드로 리다이렉트
  redirect('/map');
}