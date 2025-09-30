'use client';

import { useEffect, useRef, useState } from 'react';
import { LocationGroup } from '@/types';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';

interface PopupOverlayProps {
  map: Map | null;
  selectedLocationGroup: LocationGroup | null;
}

export default function PopupOverlay({ map, selectedLocationGroup }: PopupOverlayProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number>(0);

  // 가격 포맷팅 함수
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // 면적 포맷팅 함수
  const formatArea = (area: number) => {
    return `${ area.toLocaleString() }㎡`;
  };

  // 층수 포맷팅 함수
  const formatFloor = (floor: number) => {
    return `${ floor }층`;
  };

  // 팝업 오버레이 초기화
  useEffect(() => {
    if (!map || !popupRef.current) return;

    // 기존 오버레이 확인
    const existingOverlay = map.getOverlayById('popup');
    if (existingOverlay) {
      overlayRef.current = existingOverlay;
      return;
    }

    // 새 오버레이 생성
    const popup = new Overlay({
      id: 'popup',
      element: popupRef.current,
      positioning: 'bottom-center',
      stopEvent: false,
      offset: [-20, 25],
    });

    map.addOverlay(popup);
    overlayRef.current = popup;
    console.log('팝업 오버레이 생성 완료, ID:', popup.get('id'));

    return () => {
      if (overlayRef.current) {
        map.removeOverlay(overlayRef.current);
        overlayRef.current = null;
      }
    };
  }, [map]);

  // 그룹이 변경될 때 첫 번째 유닛으로 초기화
  useEffect(() => {
    if (selectedLocationGroup && selectedLocationGroup.units.length > 0) {
      setSelectedUnitIndex(0);
    }
  }, [selectedLocationGroup]);

  // 선택된 위치에 따라 팝업 위치 업데이트 및 지도 이동
  useEffect(() => {
    if (!map || !overlayRef.current) return;

    if (selectedLocationGroup && selectedLocationGroup.lon && selectedLocationGroup.lat) {
      console.log(`팝업 위치 설정: [${ selectedLocationGroup.lon }, ${ selectedLocationGroup.lat }]`);
      const coordinates = fromLonLat([selectedLocationGroup.lon, selectedLocationGroup.lat]);
      overlayRef.current.setPosition(coordinates);

      // 선택된 위치로 지도 중앙 이동 및 줌인
      const view = map.getView();
      view.animate({
        center: coordinates,
        zoom: Math.max(view.getZoom() || 10, 15),
        duration: 800,
      });

      // 팝업이 보이도록 강제로 스타일 설정
      if (popupRef.current) {
        popupRef.current.style.display = 'block';
        popupRef.current.style.zIndex = '10';
      }
    } else {
      overlayRef.current.setPosition(undefined);
      if (popupRef.current) {
        popupRef.current.style.display = 'none';
      }
    }
  }, [map, selectedLocationGroup]);

  // 현재 선택된 유닛 정보
  const selectedUnit = selectedLocationGroup?.units[selectedUnitIndex];

  // 팝업 내부 클릭 이벤트 처리 함수
  const handlePopupClick = (e: React.MouseEvent) => {
    // 이벤트 버블링 중지하여 지도 클릭 이벤트 발생 방지
    e.stopPropagation();
  };

  return (
    <div
      ref={popupRef}
      className="absolute bg-background p-3 rounded-lg shadow-lg pointer-events-auto z-50 ol-popup"
      onClick={handlePopupClick}
    >
      {selectedLocationGroup && selectedUnit && (
        <div className="w-80 max-w-sm">
          {/* 헤더 */}
          <div className="mb-3">
            <h3 className="font-bold text-lg mb-1">{selectedLocationGroup.name}</h3>
            <p className="text-gray-6 text-sm">{selectedLocationGroup.address}</p>
          </div>

          {/* 유닛 탭 (여러 개인 경우만) */}
          {selectedLocationGroup.units.length > 1 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {selectedLocationGroup.units.map((unit, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedUnitIndex(index)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      index === selectedUnitIndex
                        ? 'bg-primary text-white'
                        : 'bg-gray-8 text-gray-4 hover:bg-gray-7'
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

          {/* 선택된 유닛 정보 */}
          <div className="flex flex-col gap-1 text-sm">
            {/* 기본 정보 */}
            {(selectedUnit.building || selectedUnit.unit) && (
              <div className="flex gap-2">
                {selectedUnit.building && (
                  <span className="text-gray-4">{selectedUnit.building}{'동'}</span>
                )}
                {selectedUnit.unit && (
                  <span className="text-gray-4">{selectedUnit.unit}{'호'}</span>
                )}
              </div>
            )}

            {/* 면적 정보 */}
            {(selectedUnit.exclusiveArea || selectedUnit.livingArea || selectedUnit.totalArea) && (
              <div className="flex flex-col gap-0.5">
                {selectedUnit.exclusiveArea && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'전용면적'}</span>
                    <span className="text-gray-2">{formatArea(selectedUnit.exclusiveArea)}</span>
                  </div>
                )}
                {selectedUnit.livingArea && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'주거공용'}</span>
                    <span className="text-gray-2">{formatArea(selectedUnit.livingArea)}</span>
                  </div>
                )}
                {selectedUnit.totalArea && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'면적계'}</span>
                    <span className="text-gray-2">{formatArea(selectedUnit.totalArea)}</span>
                  </div>
                )}
              </div>
            )}

            {/* 기타 정보 */}
            {(selectedUnit.rooms || selectedUnit.floor || selectedLocationGroup.elevator !== undefined || selectedLocationGroup.houseType) && (
              <div className="flex flex-col gap-0.5">
                {selectedUnit.rooms && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'방수'}</span>
                    <span className="text-gray-2">{selectedUnit.rooms}{'개'}</span>
                  </div>
                )}
                {selectedUnit.floor && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'층수'}</span>
                    <span className="text-gray-2">{formatFloor(selectedUnit.floor)}</span>
                  </div>
                )}
                {selectedLocationGroup.elevator !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'승강기'}</span>
                    <span className="text-gray-2">{selectedLocationGroup.elevator ? '있음' : '없음'}</span>
                  </div>
                )}
                {selectedLocationGroup.houseType && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'주택유형'}</span>
                    <span className="text-gray-2">{selectedLocationGroup.houseType}</span>
                  </div>
                )}
              </div>
            )}

            {/* 가격 정보 */}
            {selectedUnit.price && (selectedUnit.price.deposit || selectedUnit.price.monthly || selectedUnit.price.sale) && (
              <div className="flex flex-col gap-0.5 mt-1 pt-1 border-t border-gray-8">
                {selectedUnit.price.deposit && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'보증금'}</span>
                    <span className="text-primary font-medium">{formatPrice(selectedUnit.price.deposit)}</span>
                  </div>
                )}
                {selectedUnit.price.monthly && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'월임대료'}</span>
                    <span className="text-primary font-medium">{formatPrice(selectedUnit.price.monthly)}</span>
                  </div>
                )}
                {selectedUnit.price.sale && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'매매가'}</span>
                    <span className="text-primary font-medium">{formatPrice(selectedUnit.price.sale)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
