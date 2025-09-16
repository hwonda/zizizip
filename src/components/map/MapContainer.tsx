'use client';

import { useState, useEffect } from 'react';
import { LocationData } from '@/types';
import UploadSidebar from '@/components/UploadSidebar';

interface MapContainerProps {
  children: React.ReactNode;
  onDataUploaded: (data: LocationData[])=> void;
}

export default function MapContainer({ children, onDataUploaded }: MapContainerProps) {
  // 위치 데이터 상태
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 위치 데이터 로드 함수
  const loadLocationData = () => {
    console.log('위치 데이터 로드 시도 중...');
    try {
      const storedData = sessionStorage.getItem('locationData');
      if (storedData) {
        console.log('세션 스토리지에서 데이터 찾음');
        const parsedData = JSON.parse(storedData);
        console.log(`파싱된 데이터 항목 수: ${ parsedData.length }`);

        // 좌표 데이터 검증
        const validLocations = parsedData.filter((loc: LocationData) => loc.lat && loc.lon);
        console.log(`유효한 좌표가 있는 위치 데이터: ${ validLocations.length }/${ parsedData.length }`);

        if (validLocations.length > 0) {
          console.log('첫 번째 유효한 위치 데이터:', validLocations[0]);
        } else {
          console.warn('유효한 좌표가 있는 위치 데이터가 없습니다!');
        }

        setLocations(parsedData);
        onDataUploaded(parsedData);
      } else {
        console.warn('세션 스토리지에 위치 데이터가 없습니다.');
      }
      setIsLoading(false);
    } catch (err) {
      console.error('위치 데이터 로드 실패:', err);
      setError(err instanceof Error ? err : new Error('데이터 로드 오류'));
      setIsLoading(false);
    }
  };

  // 세션 스토리지에서 위치 데이터 로드
  useEffect(() => {
    loadLocationData();

    // 위치 데이터 업데이트 이벤트 리스너 추가
    const handleLocationDataUpdated = (event: Event) => {
      console.log('위치 데이터 업데이트 이벤트 수신');
      const customEvent = event as CustomEvent<LocationData[]>;
      if (customEvent.detail) {
        console.log('새 위치 데이터:', customEvent.detail);
        setLocations(customEvent.detail);
        onDataUploaded(customEvent.detail);
      } else {
        loadLocationData(); // 이벤트에 데이터가 없으면 세션 스토리지에서 다시 로드
      }
    };

    window.addEventListener('locationDataUpdated', handleLocationDataUpdated);

    return () => {
      window.removeEventListener('locationDataUpdated', handleLocationDataUpdated);
    };
  }, [onDataUploaded]);

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex">
        {/* 좌측 업로드 사이드바 */}
        <div className="w-72 border-r border-gray-200">
          <UploadSidebar onDataUploaded={(newData) => {
            setLocations(newData);
            onDataUploaded(newData);
          }}
          />
        </div>
        {/* 지도 영역 */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <div className="text-lg font-semibold">{'데이터 로딩 중...'}</div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <div className="text-lg font-semibold text-red-600">
                {'데이터 로드 중 오류가 발생했습니다.'}
              </div>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
