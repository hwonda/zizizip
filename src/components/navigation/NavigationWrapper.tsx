'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
// import DebugSidebar from '@/components/navigation/DebugSidebar';
import { ExtendedLocationData } from '@/types';
import Logo from '@/components/icons/Logo';
import UploadSidebar from '@/components/navigation/UploadSidebar';
import LHSidebar from '@/components/navigation/LHSidebar';
import Tabs from '@/components/ui/Tabs';

interface NavigationWrapperProps {
  showAllMarkers: boolean;
  showDebugInfo: boolean;
  onToggleMarkers: ()=> void;
  onToggleDebugInfo: ()=> void;
  onDataUploaded: (data: ExtendedLocationData[])=> void;
}

type TabType = '업로드' | 'LH' | 'SH' | 'GH';

export default function NavigationWrapper({
  // showAllMarkers,
  // showDebugInfo,
  // onToggleMarkers,
  // onToggleDebugInfo,
  onDataUploaded,
}: NavigationWrapperProps) {
  const router = useRouter();
  const [lhData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('업로드');
  const tabs: TabType[] = ['업로드', 'LH', 'SH', 'GH'];

  return (
    <>

      <div className="absolute left-6 top-5 flex flex-col gap-2 z-10 w-72">
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

        {/* 탭 메뉴 */}
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* 탭별 컨텐츠 */}
        {activeTab === '업로드' && (
          <UploadSidebar onDataUploaded={onDataUploaded} />
        )}
        {activeTab === 'LH' && (
          <LHSidebar />
        )}
        {activeTab === 'SH' && (
          <div className="w-full bg-background rounded-lg shadow-lg p-4">
            <p className="text-gray-3">{'SH 공고 내용을 준비 중입니다.'}</p>
          </div>
        )}
        {activeTab === 'GH' && (
          <div className="w-full bg-background rounded-lg shadow-lg p-4">
            <p className="text-gray-3">{'GH 공고 내용을 준비 중입니다.'}</p>
          </div>
        )}

        {/* <DebugSidebar
          showAllMarkers={showAllMarkers}
          showDebugInfo={showDebugInfo}
          onToggleMarkers={onToggleMarkers}
          onToggleDebugInfo={onToggleDebugInfo}
          /> */}
      </div>
      <span className="text-xs text-gray-1 bg-gray-10">
        {JSON.stringify(lhData?.[1]?.dsList)}
      </span>
    </>
  );
}
