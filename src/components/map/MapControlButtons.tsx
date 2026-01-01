'use client';

import { TypeOutline, Type, SlidersHorizontal } from 'lucide-react';
import { useFilterStore } from '@/stores/useFilterStore';
import FilterPanel from '@/components/map/filter/FilterPanel';

interface MapControlButtonsProps {
  showMarkerLabels: boolean;
  onToggleMarkerLabels: ()=> void;
}

export default function MapControlButtons({
  showMarkerLabels,
  onToggleMarkerLabels,
}: MapControlButtonsProps) {
  const { isOpen, togglePanel } = useFilterStore();

  return (
    <div className="absolute top-5 right-5 z-50 flex flex-col gap-3">
      {/* 마커 이름 표시 토글 버튼 */}
      <button
        onClick={onToggleMarkerLabels}
        className={`w-20 flex items-center gap-1 p-2 rounded-lg shadow-lg hover:scale-98 active:scale-94 ${
          showMarkerLabels ? 'bg-primary text-white' : 'bg-background text-main'
        }`}
        title={showMarkerLabels ? '마커 이름 숨기기' : '마커 이름 표시'}
      >
        {showMarkerLabels ? (
          <TypeOutline className="size-4" />
        ) : (
          <Type className="size-4" />
        )}
        <span className="w-12 text-sm font-medium whitespace-nowrap">
          {'주택명'}
        </span>
      </button>

      {/* 필터 버튼 */}
      <div className="relative">
        <button
          data-filter-button
          onClick={togglePanel}
          className={`w-20 flex items-center gap-1 p-2 rounded-lg shadow-lg hover:scale-98 active:scale-94 ${
            isOpen ? 'bg-primary text-white' : 'bg-background text-main'
          }`}
          title="필터"
        >
          <SlidersHorizontal className="size-4" />
          <span className="w-12 text-sm font-medium whitespace-nowrap">
            {'필터'}
          </span>
        </button>

        {/* 필터 패널 */}
        <FilterPanel />
      </div>
    </div>
  );
}
