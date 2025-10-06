'use client';

import Logo from '@/components/icons/Logo';
// import DebugSidebar from '@/components/navigation/DebugSidebar';
import UploadSidebar from '@/components/navigation/UploadSidebar';
import { ExtendedLocationData } from '@/types';

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
  return (
    <>

      <div className="absolute left-6 top-5 flex flex-col gap-4 z-10 w-72">
        <div className="flex items-center gap-2 z-10">
          <Logo />
          <span className="flex flex-col font-bold text-stroke text-sub">
            {'지지집'}
            <span className="text-sm text-gray-1 mt-[-4px]">{'엑셀로 쉽게 부동산 위치를 지도에 표시하세요'}</span>
          </span>
        </div>
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
