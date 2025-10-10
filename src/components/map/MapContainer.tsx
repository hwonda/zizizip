'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExtendedLocationData } from '@/types';
import { useDatasetManager } from '@/hooks/useDatasetManager';
import Loading from '@/components/common/Loading';

interface MapContainerProps {
  children: React.ReactNode;
  onDataUploaded: (data: ExtendedLocationData[])=> void;
}

export default function MapContainer({ children, onDataUploaded }: MapContainerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 데이터셋 관리 훅 사용
  const { getSelectedData } = useDatasetManager();

  // 선택된 데이터셋들의 데이터를 로드하는 함수
  const loadSelectedData = useCallback(() => {
    console.log('선택된 데이터셋 로드 시도 중...');
    try {
      const selectedData = getSelectedData();
      console.log(`선택된 데이터 항목 수: ${ selectedData.length }`);

      // 좌표 데이터 검증
      const validLocations = selectedData.filter((loc) => loc.lat && loc.lon);
      console.log(`유효한 좌표가 있는 위치 데이터: ${ validLocations.length }/${ selectedData.length }`);

      if (validLocations.length > 0) {
        console.log('첫 번째 유효한 위치 데이터:', validLocations[0]);
      } else if (selectedData.length > 0) {
        console.warn('유효한 좌표가 있는 위치 데이터가 없습니다!');
      }

      onDataUploaded(selectedData);
      setIsLoading(false);
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      setError(err instanceof Error ? err : new Error('데이터 로드 오류'));
      setIsLoading(false);
    }
  }, [getSelectedData, onDataUploaded]);

  // 초기 데이터 로드 및 이벤트 리스너 설정
  useEffect(() => {
    loadSelectedData();

    // 위치 데이터 업데이트 이벤트 리스너 추가
    const handleLocationDataUpdated = (event: Event) => {
      console.log('위치 데이터 업데이트 이벤트 수신');
      const customEvent = event as CustomEvent<ExtendedLocationData[]>;
      if (customEvent.detail) {
        console.log('새 위치 데이터:', customEvent.detail);
        onDataUploaded(customEvent.detail);
      } else {
        loadSelectedData(); // 이벤트에 데이터가 없으면 다시 로드
      }
    };

    window.addEventListener('locationDataUpdated', handleLocationDataUpdated);

    return () => {
      window.removeEventListener('locationDataUpdated', handleLocationDataUpdated);
    };
  }, [loadSelectedData, onDataUploaded]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <Loading message="지도 로딩 중" size="lg" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-lg font-semibold text-error">
            {'데이터 로드 중 오류가 발생했습니다.'}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
