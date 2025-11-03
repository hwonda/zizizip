'use client';

import { useState } from 'react';
import { LocationGroup } from '@/types';
import Map from 'ol/Map';
import { Clipboard, ClipboardCheck, X } from 'lucide-react';
import { usePopupOverlay } from '@/hooks/usePopupOverlay';
import { formatArea } from '@/utils/formatters';
import HouseBadge from './HouseBadge';
import Badge from './Badge';
import PriceSection from './PriceSection';

interface PopupOverlayProps {
  map: Map | null;
  selectedLocationGroup: LocationGroup | null;
  onClose: ()=> void;
}

export default function PopupOverlay({ map, selectedLocationGroup, onClose }: PopupOverlayProps) {
  const { popupRef } = usePopupOverlay({ map, selectedLocationGroup });
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // 현재 선택된 유닛 정보
  const selectedUnit = selectedLocationGroup?.units[selectedUnitIndex];

  // 클립보드에 주소 복사
  const copyAddressToClipboard = async () => {
    if (!selectedLocationGroup?.address) return;

    try {
      await navigator.clipboard.writeText(selectedLocationGroup.address);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.log('주소 복사에 실패했습니다:', error);
    }
  };

  return (
    <div
      ref={popupRef}
      className="absolute bg-background/95 p-3 rounded-lg shadow-xl pointer-events-auto z-50 ol-popup border border-primary"
    >
      {/* 삼각형 포인터 */}
      <div className="absolute -top-2 left-3 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-primary" />

      {selectedLocationGroup && selectedUnit && (
        <div className="w-100 flex flex-col gap-1.5">
          {/* 헤더 */}
          <div className="border-b border-gray-9 space-y-1 pb-1">
            <div className="flex justify-between items-center gap-1.5">
              <h3 className="font-bold">{selectedLocationGroup.name}</h3>
              <button
                type="button"
                title="팝업 닫기"
                onClick={onClose}
                className="flex-shrink-0 p-1 transition-colors text-error hover:text-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-0.5">
              {selectedUnit.houseType && <HouseBadge houseType={selectedUnit.houseType} />}
              {selectedUnit.elevator !== undefined && <Badge title="승강기" text={selectedUnit.elevator ? 'O' : 'X'} />}
            </div>
            <span className="flex items-start gap-0.5">
              <p
                className="text-gray-3 text-sm select-text cursor-text"
                style={{ userSelect: 'text' }}
              >
                {selectedLocationGroup.address}
              </p>
              <button
                onClick={copyAddressToClipboard}
                className={`flex-shrink-0 p-0.5 transition-colors ${
                  isCopied
                    ? 'text-primary'
                    : 'text-gray-5 hover:text-gray-3'
                }`}
                title={isCopied ? '주소 복사 완료' : '주소 복사'}
                type="button"
              >
                {isCopied ? (
                  <ClipboardCheck className="w-4 h-4" />
                ) : (
                  <Clipboard className="w-4 h-4" />
                )}
              </button>
            </span>
          </div>

          {/* 유닛 탭 */}
          {selectedLocationGroup.units.length > 0 && (
            <div className="py-0.5">
              <div className="flex flex-wrap gap-1">
                {selectedLocationGroup.units.map((unit, index) => (
                  <button
                    type="button"
                    title={`${ index + 1 }번째 주택 정보로 이동`}
                    key={index}
                    onClick={() => setSelectedUnitIndex(index)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      index === selectedUnitIndex
                        ? 'bg-primary text-white font-bold'
                        : 'bg-gray-9 text-gray-3 hover:bg-gray-8'
                    }`}
                  >
                    {unit.building && unit.unit
                      ? `${ unit.building }동 ${ unit.unit }호`
                      : unit.building
                        ? `${ unit.building }동`
                        : unit.unit
                          ? `${ unit.unit }호`
                          : `유닛 ${ index + 1 }`
                    }
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 속성 배지 */}
          <div className="flex flex-wrap gap-1 text-sm">
            {selectedUnit.floor && <Badge text={selectedUnit.floor.toString() + '층'} />}
            {selectedUnit.exclusiveArea && <Badge title="전용" text={formatArea(selectedUnit.exclusiveArea)} />}
            {selectedUnit.rooms && <Badge title="방" text={selectedUnit.rooms.toString() + '개'} />}
            {selectedUnit.livingArea && <Badge title="공용" text={formatArea(selectedUnit.livingArea)} />}
          </div>

          {/* 가격 정보 */}
          <PriceSection unit={selectedUnit} />
        </div>
      )}
    </div>
  );
}
