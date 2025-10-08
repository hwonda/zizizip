'use client';

import Image from 'next/image';
import { useState, useRef, useCallback } from 'react';
import { ExtendedLocationData, LocationGroup } from '@/types';
import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';

import NavigationWrapper from '@/components/navigation/NavigationWrapper';
import MapContainer from '@/components/map/MapContainer';
import MapView from '@/components/map/MapView';
import MarkerManager from '@/components/map/MarkerManager';
import PopupOverlay from '@/components/map/PopupOverlay';
import DebugPanel from '@/components/map/DebugPanel';

export default function MapPageClient() {
  // 지도 상태
  const mapRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);

  // UI 상태
  const [showAllMarkers, setShowAllMarkers] = useState(true);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

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

  return (
    <>
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
        </div>
        <footer className="absolute bottom-5 right-5 flex flex-col items-end z-50">
          <Image src="/images/v-world_ci.png" alt="v-world-ci" width={100} height={100} />
          <p className="text-sm text-sub">{'© 2025 지지집. All rights reserved.'}</p>
        </footer>
      </div>
    </>
  );
}
