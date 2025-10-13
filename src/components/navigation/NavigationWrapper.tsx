'use client';

import { useRouter } from 'next/navigation';
// import DebugSidebar from '@/components/navigation/DebugSidebar';
import { ExtendedLocationData } from '@/types';
import Logo from '@/components/icons/Logo';
import UploadSidebar from '@/components/navigation/UploadSidebar';

interface NavigationWrapperProps {
  showAllMarkers: boolean;
  showDebugInfo: boolean;
  onToggleMarkers: ()=> void;
  onToggleDebugInfo: ()=> void;
  onDataUploaded: (data: ExtendedLocationData[])=> void;
}

export default function NavigationWrapper({
  // showAllMarkers,
  // showDebugInfo,
  // onToggleMarkers,
  // onToggleDebugInfo,
  onDataUploaded,
}: NavigationWrapperProps) {
  const router = useRouter();
  return (
    <>

      <div className="absolute left-6 top-5 flex flex-col gap-4 z-10 w-72">
        <header>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 z-10"
          >
            <Logo />
            <h1 className="flex flex-col items-start font-bold text-stroke text-sub">
              {'지지집'}
              <span className="text-sm text-gray-1 mt-[-4px]">{'엑셀로 된 부동산 정보를 지도에 표출하세요'}</span>
            </h1>
          </button>
        </header>
        {/* 사이드바 */}
        <UploadSidebar onDataUploaded={onDataUploaded} />

        {/* <DebugSidebar
          showAllMarkers={showAllMarkers}
          showDebugInfo={showDebugInfo}
          onToggleMarkers={onToggleMarkers}
          onToggleDebugInfo={onToggleDebugInfo}
        /> */}
      </div>
    </>
  );
}
