'use client';

import { LocationData } from '@/types';
import Map from 'ol/Map';
import { useAppSelector } from '@/store/hooks';

interface DebugPanelProps {
  show: boolean;
  map: Map | null;
  locations?: LocationData[]; // Redux에서 가져오므로 optional로 변경
}

export default function DebugPanel({ show, map, locations: propsLocations }: DebugPanelProps) {
  const reduxLocations = useAppSelector((state) => state.location.locations);
  const locations = propsLocations || reduxLocations;

  if (!show) return null;

  const validLocationsCount = locations.filter((loc) => loc.lat && loc.lon).length;

  return (
    <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-20 max-w-md max-h-screen overflow-auto">
      <h3 className="font-bold text-lg mb-2">{'디버그 정보'}</h3>

      <div className="mb-3">
        <h4 className="font-semibold text-sm mb-1">{'지도 상태'}</h4>
        <p className="text-xs">{'지도 인스턴스: '}{map ? '초기화됨' : '초기화되지 않음'}</p>
      </div>

      <div className="mb-3">
        <h4 className="font-semibold text-sm mb-1">{'위치 데이터'}</h4>
        <p className="text-xs">{'총 데이터 수: '}{locations.length}</p>
        <p className="text-xs">{'유효한 좌표 수: '}{validLocationsCount}</p>
      </div>

      <div>
        <h4 className="font-semibold text-sm mb-1">{'위치 데이터'}</h4>
        {locations.length > 0 ? (
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(locations, null, 2)}
          </pre>
        ) : (
          <p className="text-xs text-red-500">{'데이터 없음'}</p>
        )}
      </div>
    </div>
  );
}
