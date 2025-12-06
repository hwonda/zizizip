'use client';

import Image from 'next/image';
import { useState, useRef, useCallback } from 'react';
import { ExtendedLocationData, LocationGroup } from '@/types';
import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';

import { mapPageMetadata } from '@/constants/metadata';
import NavigationWrapper from '@/components/navigation/NavigationWrapper';
import MapContainer from '@/components/map/MapContainer';
import MapView from '@/components/map/MapView';
import MarkerManager from '@/components/map/MarkerManager';
import PopupOverlay from '@/components/map/popup/PopupOverlay';
import DebugPanel from '@/components/map/DebugPanel';
import MapControlButtons from '@/components/map/MapControlButtons';
// import NoticePopup from '@/components/common/NoticePopup';

export default function MapPageClient() {
  // 지도 상태
  const mapRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);

  // UI 상태
  const [showAllMarkers, setShowAllMarkers] = useState(true);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showMarkerLabels, setShowMarkerLabels] = useState(true);

  // 데이터 상태
  const [locations, setLocations] = useState<ExtendedLocationData[]>([]);
  const [selectedLocationGroup, setSelectedLocationGroup] = useState<LocationGroup | null>(null);

  // 지도 초기화 핸들러 (useCallback으로 메모이제이션)
  const handleMapInitialized = useCallback((map: Map, vectorSource: VectorSource) => {
    mapRef.current = map;
    vectorSourceRef.current = vectorSource;
  }, []);

  // 데이터 업로드 핸들러 (useCallback으로 메모이제이션)
  const handleDataUploaded = useCallback((data: ExtendedLocationData[]) => {
    console.log('MapPage에서 데이터 업로드됨:', data);
    setLocations(data);
  }, []);

  // 공지사항 내용 정의
  // const notices = [
  //   {
  //     id: 'notice-2025-12-03',
  //     title: '공지사항',
  //     content: (
  //       <div className="space-y-1">
  //         <p className="text-lg text-main mb-1">
  //           {'서비스 점검 안내'}
  //         </p>
  //         <p className="text-gray-1">
  //           {'점검 일정 : 2025.12.5.(금) 18시 ~ 2025.12.6.(토) 09시(약 15시간)'}
  //         </p>
  //         <p className="text-gray-5 text-sm">
  //           {'※ V-World 서비스 점검으로 인해 잠시 서비스가 중단될 예정입니다.'}
  //         </p>
  //         <p className="text-gray-5 text-sm">
  //           {'※ 점검 일정은 국토교통부 작업 진행 사항에 따라 일부 변동될 수 있습니다.'}
  //         </p>
  //         <a
  //           href="https://www.vworld.kr/v4po_brdnotice_s002.do?brdIde=31403"
  //           target="_blank"
  //           rel="noopener noreferrer"
  //           className="text-primary hover:text-secondary transition-all duration-300 underline underline-offset-2"
  //         >
  //           {'V-world 서비스 점검 공지 바로가기'}
  //         </a>
  //       </div>
  //     ),
  //   },
  // ];

  return (
    <>
      {/* <NoticePopup notices={notices} /> */}
      <title className='sr-only'>{mapPageMetadata.title}</title>

      <NavigationWrapper
        showAllMarkers={showAllMarkers}
        showDebugInfo={showDebugInfo}
        onToggleMarkers={() => setShowAllMarkers(!showAllMarkers)}
        onToggleDebugInfo={() => setShowDebugInfo(!showDebugInfo)}
        onDataUploaded={handleDataUploaded}
      />

      <div className="h-screen flex flex-col">
        {/* 지도 영역 */}
        <div className="flex-1 relative">
          <MapContainer onDataUploaded={handleDataUploaded}>
            <MapView
              onMapInitialized={handleMapInitialized}
            />

            <MarkerManager
              map={mapRef.current}
              vectorSource={vectorSourceRef.current}
              locations={locations}
              showAllMarkers={showAllMarkers}
              showMarkerLabels={showMarkerLabels}
              onMarkerClick={setSelectedLocationGroup}
            />

            <PopupOverlay
              map={mapRef.current}
              selectedLocationGroup={selectedLocationGroup}
              onClose={() => setSelectedLocationGroup(null)}
            />

            <DebugPanel
              show={showDebugInfo}
              map={mapRef.current}
              locations={locations}
            />
          </MapContainer>

          {/* 지도 컨트롤 버튼 */}
          <MapControlButtons
            showMarkerLabels={showMarkerLabels}
            onToggleMarkerLabels={() => setShowMarkerLabels(!showMarkerLabels)}
          />
        </div>
        <footer className="absolute bottom-5 right-5 flex flex-col items-end z-50">
          <Image src="/images/v-world_ci.png" alt="v-world-ci" width={100} height={100} />
          <p className="text-sm text-sub">{'© 2025 지지집. All rights reserved.'}</p>
        </footer>
      </div>
    </>
  );
}
