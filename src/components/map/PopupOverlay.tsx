'use client';

import { useEffect, useRef } from 'react';
import { LocationData } from '@/types';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';

interface PopupOverlayProps {
  map: Map | null;
  selectedLocation: LocationData | null;
}

export default function PopupOverlay({ map, selectedLocation }: PopupOverlayProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<Overlay | null>(null);

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

  // 선택된 위치에 따라 팝업 위치 업데이트 및 지도 이동
  useEffect(() => {
    if (!map || !overlayRef.current) return;

    if (selectedLocation && selectedLocation.lon && selectedLocation.lat) {
      console.log(`팝업 위치 설정: [${ selectedLocation.lon }, ${ selectedLocation.lat }]`);
      const coordinates = fromLonLat([selectedLocation.lon, selectedLocation.lat]);
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
  }, [map, selectedLocation]);

  return (
    <div
      ref={popupRef}
      className="absolute bg-background-80 bg-background p-3 rounded-lg shadow-lg transform pointer-events-none shadow-lg"
    >
      {selectedLocation && (
        <div className="w-72 max-w-xs">
          <h3 className="font-bold text-lg mb-1">{selectedLocation.name}</h3>
          <p className="text-gray-6 text-sm mb-2">{selectedLocation.address}</p>

          <div className="flex flex-col gap-1 text-sm">
            {/* 기본 정보 */}
            {(selectedLocation.building || selectedLocation.unit) && (
              <div className="flex gap-2">
                {selectedLocation.building && (
                  <span className="text-gray-4">{selectedLocation.building}{'동'}</span>
                )}
                {selectedLocation.unit && (
                  <span className="text-gray-4">{selectedLocation.unit}{'호'}</span>
                )}
              </div>
            )}

            {/* 면적 정보 */}
            {(selectedLocation.exclusiveArea || selectedLocation.livingArea || selectedLocation.totalArea) && (
              <div className="flex flex-col gap-0.5">
                {selectedLocation.exclusiveArea && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'전용면적'}</span>
                    <span className="text-gray-2">{formatArea(selectedLocation.exclusiveArea)}</span>
                  </div>
                )}
                {selectedLocation.livingArea && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'주거공용'}</span>
                    <span className="text-gray-2">{formatArea(selectedLocation.livingArea)}</span>
                  </div>
                )}
                {selectedLocation.totalArea && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'면적계'}</span>
                    <span className="text-gray-2">{formatArea(selectedLocation.totalArea)}</span>
                  </div>
                )}
              </div>
            )}

            {/* 기타 정보 */}
            {(selectedLocation.rooms || selectedLocation.floor || selectedLocation.elevator !== undefined || selectedLocation.houseType) && (
              <div className="flex flex-col gap-0.5">
                {selectedLocation.rooms && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'방수'}</span>
                    <span className="text-gray-2">{selectedLocation.rooms}{'개'}</span>
                  </div>
                )}
                {selectedLocation.floor && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'층수'}</span>
                    <span className="text-gray-2">{formatFloor(selectedLocation.floor)}</span>
                  </div>
                )}
                {selectedLocation.elevator !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'승강기'}</span>
                    <span className="text-gray-2">{selectedLocation.elevator ? '있음' : '없음'}</span>
                  </div>
                )}
                {selectedLocation.houseType && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'주택유형'}</span>
                    <span className="text-gray-2">{selectedLocation.houseType}</span>
                  </div>
                )}
              </div>
            )}

            {/* 가격 정보 */}
            {(selectedLocation.deposit || selectedLocation.monthlyRent || selectedLocation.salePrice) && (
              <div className="flex flex-col gap-0.5 mt-1 pt-1 border-t border-gray-8">
                {selectedLocation.deposit && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'보증금'}</span>
                    <span className="text-primary font-medium">{formatPrice(selectedLocation.deposit)}</span>
                  </div>
                )}
                {selectedLocation.monthlyRent && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'월임대료'}</span>
                    <span className="text-primary font-medium">{formatPrice(selectedLocation.monthlyRent)}</span>
                  </div>
                )}
                {selectedLocation.salePrice && (
                  <div className="flex justify-between">
                    <span className="text-gray-5">{'매매가'}</span>
                    <span className="text-primary font-medium">{formatPrice(selectedLocation.salePrice)}</span>
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
