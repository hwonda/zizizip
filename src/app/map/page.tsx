'use client';

import { useState, useRef } from 'react';
import { LocationData } from '@/types';
import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';

// 컴포넌트 임포트
import MapContainer from '@/components/map/MapContainer';
import MapHeader from '@/components/map/MapHeader';
import MapView from '@/components/map/MapView';
import MarkerManager from '@/components/map/MarkerManager';
import PopupOverlay from '@/components/map/PopupOverlay';
import DebugPanel from '@/components/map/DebugPanel';

export default function MapPage() {
  // 지도 상태
  const mapRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);

  // UI 상태
  const [showAllMarkers, setShowAllMarkers] = useState(true);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // 데이터 상태
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  // 지도 초기화 핸들러
  const handleMapInitialized = (map: Map, vectorSource: VectorSource) => {
    mapRef.current = map;
    vectorSourceRef.current = vectorSource;
  };

  // 데이터 업로드 핸들러
  const handleDataUploaded = (data: LocationData[]) => {
    setLocations(data);
  };

  return (
    <>
      <MapHeader
        showAllMarkers={showAllMarkers}
        showDebugInfo={showDebugInfo}
        onToggleMarkers={() => setShowAllMarkers(!showAllMarkers)}
        onToggleDebugInfo={() => setShowDebugInfo(!showDebugInfo)}
      />

      <MapContainer onDataUploaded={handleDataUploaded}>
        <MapView
          locations={locations}
          onMapInitialized={handleMapInitialized}
        />

        <MarkerManager
          map={mapRef.current}
          vectorSource={vectorSourceRef.current}
          locations={locations}
          showAllMarkers={showAllMarkers}
          onMarkerClick={setSelectedLocation}
        />

        <PopupOverlay
          map={mapRef.current}
          selectedLocation={selectedLocation}
        />

        <DebugPanel
          show={showDebugInfo}
          map={mapRef.current}
          locations={locations}
        />
      </MapContainer>
    </>
  );
}