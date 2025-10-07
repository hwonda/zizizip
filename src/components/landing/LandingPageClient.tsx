'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { shouldShowLanding } from '@/utils/landingPreference';
import LandingPage from '@/components/landing/LandingPage';

export default function LandingPageClient() {
  const router = useRouter();
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    const show = shouldShowLanding();
    setShowLanding(show);

    if (!show) {
      router.push('/map');
    }
  }, [router]);

  if (!showLanding) {
    return null;
  }

  return <LandingPage />;
}
