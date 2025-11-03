import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import { LocationGroup } from '@/types';

interface UsePopupOverlayProps {
  map: Map | null;
  selectedLocationGroup: LocationGroup | null;
}

export function usePopupOverlay({ map, selectedLocationGroup }: UsePopupOverlayProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<Overlay | null>(null);

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
      stopEvent: true, // 팝업에서 발생하는 모든 이벤트를 중지
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

  return { popupRef };
}
