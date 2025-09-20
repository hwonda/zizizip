'use client';

import DebugSidebar from '@/components/navigation/DebugSidebar';
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
  showAllMarkers,
  showDebugInfo,
  onToggleMarkers,
  onToggleDebugInfo,
  onDataUploaded,
}: NavigationWrapperProps) {
  return (
    <div className="bg-background-90 absolute left-6 top-6 flex flex-col gap-4 z-10 w-72 shadow-lg rounded-lg p-4 border border-gray-7">
      <h1 className="text-xl font-bold text-accent-1">{'Zizizip'}</h1>

      {/* 사이드바 */}
      <UploadSidebar onDataUploaded={onDataUploaded} />

      <DebugSidebar
        showAllMarkers={showAllMarkers}
        showDebugInfo={showDebugInfo}
        onToggleMarkers={onToggleMarkers}
        onToggleDebugInfo={onToggleDebugInfo}
      />
    </div>
  );
}
