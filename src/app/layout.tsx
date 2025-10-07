import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import QueryProvider from '@/components/providers/QueryProvider';
import { siteMetadata } from '@/constants/metadata';
import GoogleAnalytics from '@/constants/GoogleAnalytics';
import MicrosoftClarity from '@/constants/MicrosoftClarity';
import StructuredData from '@/constants/StructuredData';
import '@/styles/globals.scss';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.url),
  title: siteMetadata.title,
  description: siteMetadata.description,
  keywords: ['부동산', '지도', '위치', 'CSV', 'Excel', 'LH', 'SH', '공공임대', '매물', '부동산 지도', '위치 검색'],
  authors: [{ name: 'zizizip' }],
  creator: 'zizizip',
  publisher: 'zizizip',
  alternates: {
    canonical: siteMetadata.url,
  },
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon.ico' },
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png' },
    ],
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '',
    other: {
      'naver-site-verification': '',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <StructuredData />
        <GoogleAnalytics />
        <MicrosoftClarity />
      </head>
      <body
        className={`${ geistSans.variable } ${ geistMono.variable } antialiased`}
      >
        <h1 className="sr-only">{'지지집 - 엑셀로 된 부동산 정보를 지도에 표출하세요'}</h1>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
