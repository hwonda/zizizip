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
      offset: [0, -10],
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

  // 선택된 위치에 따라 팝업 위치 업데이트
  useEffect(() => {
    if (!map || !overlayRef.current) return;

    if (selectedLocation && selectedLocation.lon && selectedLocation.lat) {
      console.log(`팝업 위치 설정: [${ selectedLocation.lon }, ${ selectedLocation.lat }]`);
      const coordinates = fromLonLat([selectedLocation.lon, selectedLocation.lat]);
      overlayRef.current.setPosition(coordinates);

      // 팝업이 보이도록 강제로 스타일 설정
      if (popupRef.current) {
        popupRef.current.style.display = 'block';
        popupRef.current.style.zIndex = '1000';
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
      className="absolute bg-white p-3 rounded-lg shadow-lg transform -translate-x-1/2 pointer-events-none"
      style={{
        zIndex: 1000,
        display: selectedLocation ? 'block' : 'none',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
      }}
    >
      {selectedLocation && (
        <div className="w-64">
          <h3 className="font-bold text-lg">{selectedLocation.name}</h3>
          <p className="text-gray-600 text-sm mb-1">{selectedLocation.address}</p>
          <p className="font-semibold text-blue-600">
            {formatPrice(selectedLocation.price)}
          </p>
        </div>
      )}
    </div>
  );
}
