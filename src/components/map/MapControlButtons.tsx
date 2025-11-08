'use client';

import { TypeOutline, Type } from 'lucide-react';

interface MapControlButtonsProps {
  showMarkerLabels: boolean;
  onToggleMarkerLabels: ()=> void;
}

export default function MapControlButtons({
  showMarkerLabels,
  onToggleMarkerLabels,
}: MapControlButtonsProps) {
  return (
    <div className="absolute top-5 right-5 z-50 flex flex-col gap-3">
      {/* 마커 이름 표시 토글 버튼 */}
      <button
        onClick={onToggleMarkerLabels}
        className={`flex items-center gap-1 p-2 rounded-lg shadow-lg hover:scale-98 active:scale-94 ${
          showMarkerLabels ? 'bg-primary text-white' : 'bg-background text-main'
        }`}
        title={showMarkerLabels ? '마커 이름 숨기기' : '마커 이름 표시'}
      >
        {showMarkerLabels ? (
          <TypeOutline className="size-4" />
        ) : (
          <Type className="size-4" />
        )}
        <span className="text-sm font-medium whitespace-nowrap">
          {'주택명'}
        </span>
      </button>

      {/* 맵 버튼 추가 예정 */}
    </div>
  );
}
