'use client';

import { useEffect, useCallback } from 'react';
import { LocationData } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLocations, setLoading, setError } from '@/store/locationSlice';

interface MapContainerProps {
  children: React.ReactNode;
}

export default function MapContainer({ children }: MapContainerProps) {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.location);

  // 위치 데이터 로드 함수 (useCallback으로 메모이제이션)
  const loadLocationData = useCallback(() => {
    console.log('위치 데이터 로드 시도 중...');
    dispatch(setLoading(true));
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
        dispatch(setLocations(parsedData));
      } else {
        console.warn('세션 스토리지에 위치 데이터가 없습니다.');
      }
      dispatch(setLoading(false));
    } catch (err) {
      console.error('위치 데이터 로드 실패:', err);
      dispatch(setError(err instanceof Error ? err.message : '데이터 로드 오류'));
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  // 세션 스토리지에서 위치 데이터 로드
  useEffect(() => {
    loadLocationData();

    // 위치 데이터 업데이트 이벤트 리스너 추가
    const handleLocationDataUpdated = (event: Event) => {
      console.log('위치 데이터 업데이트 이벤트 수신');
      const customEvent = event as CustomEvent<LocationData[]>;
      if (customEvent.detail) {
        console.log('새 위치 데이터:', customEvent.detail);
        dispatch(setLocations(customEvent.detail));
      } else {
        loadLocationData(); // 이벤트에 데이터가 없으면 세션 스토리지에서 다시 로드
      }
    };

    window.addEventListener('locationDataUpdated', handleLocationDataUpdated);

    return () => {
      window.removeEventListener('locationDataUpdated', handleLocationDataUpdated);
    };
  }, [loadLocationData, dispatch]);

  return (
    <div className="relative w-full h-full">
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
  );
}
