'use client';

import { useEffect, useRef, useState } from 'react';
import { LocationGroup } from '@/types';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import { Clipboard, ClipboardCheck, X } from 'lucide-react';

interface BadgeProps {
  title?: string;
  text: string;
}

const Badge = ({ title, text }: BadgeProps) => {
  return (
    <div className="flex items-center gap-0.5 border border-gray-8 rounded-md px-2 py-0.5 text-sm">
      <span className="text-gray-5">{title}</span>
      <span className="text-gray-2">{text}</span>
    </div>
  );
};

interface PopupOverlayProps {
  map: Map | null;
  selectedLocationGroup: LocationGroup | null;
  onClose: ()=> void;
}

export default function PopupOverlay({ map, selectedLocationGroup, onClose }: PopupOverlayProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);

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
      className="absolute bg-background p-3 rounded-lg shadow-lg pointer-events-auto z-50 ol-popup"
    >
      {selectedLocationGroup && selectedUnit && (
        <div className="w-100 flex flex-col gap-1.5">
          {/* 헤더 */}
          <div className="border-b border-gray-9">
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
              {selectedUnit.houseType && <Badge text={selectedUnit.houseType} />}
              {selectedUnit.elevator !== undefined && <Badge title="승강기" text={selectedUnit.elevator ? 'O' : 'X'} />}
            </div>
            <span className="flex items-start gap-0.5 py-1.5">
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
            <div className="py-1">
              {/* {selectedLocationGroup.units.length > 1 && (
                <div className="text-gray-3 text-sm font-medium flex items-center gap-0.5 mb-1">
                  <MousePointer2 className="w-4 h-4 text-gray-5" />
                  {'호실 선택'}
                </div>
              )} */}
              <div className="flex flex-wrap gap-1">
                {selectedLocationGroup.units.map((unit, index) => (
                  <button
                    type="button"
                    title={`${ index + 1 }번째 주택 정보로 이동`}
                    key={index}
                    onClick={() => setSelectedUnitIndex(index)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      index === selectedUnitIndex
                        ? 'bg-primary text-white'
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

          {/* 선택된 유닛 정보 */}
          <div className="flex flex-col gap-1">
            {/* {(selectedUnit.building || selectedUnit.unit) && (
              <div className="flex gap-2">
                {selectedUnit.building && (
                  <span className="text-gray-3">{selectedUnit.building}{'동'}</span>
                )}
                {selectedUnit.unit && (
                  <span className="text-gray-3">{selectedUnit.unit}{'호'}{' 정보'}</span>
                )}
              </div>
            )} */}
            {/* 가격 정보 */}
            {selectedUnit.price && (selectedUnit.price.deposit || selectedUnit.price.monthly || selectedUnit.price.sale) && (
              <div className="flex flex-col gap-0.5 border border-secondary rounded-md p-1 text-sm">
                {selectedUnit.price.deposit && (
                  <div className="flex justify-between gap-1">
                    <span className="text-gray-3">{'보증금'}</span>
                    <span className="text-primary font-medium">{formatPrice(selectedUnit.price.deposit)}</span>
                  </div>
                )}
                {selectedUnit.price.monthly && (
                  <div className="flex justify-between gap-1">
                    <span className="text-gray-3">{'월임대료'}</span>
                    <span className="text-primary font-medium">{formatPrice(selectedUnit.price.monthly)}</span>
                  </div>
                )}
                {selectedUnit.price.sale && (
                  <div className="flex justify-between gap-1">
                    <span className="text-gray-3">{'매매가'}</span>
                    <span className="text-primary font-medium">{formatPrice(selectedUnit.price.sale)}</span>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-0.5 text-sm">
              {selectedUnit.floor && <Badge text={selectedUnit.floor.toString() + '층'} />}
              {selectedUnit.exclusiveArea && <Badge title="전용" text={formatArea(selectedUnit.exclusiveArea)} />}
              {selectedUnit.rooms && <Badge title="방" text={selectedUnit.rooms.toString() + '개'} />}
              {selectedUnit.livingArea && <Badge title="공용" text={formatArea(selectedUnit.livingArea)} />}
            </div>
            {/*
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
            )} */}
          </div>
        </div>
      )}
    </div>
  );
}
