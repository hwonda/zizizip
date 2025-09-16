'use client';

import { useEffect, useCallback, useRef } from 'react';
import { LocationData } from '@/types';
import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style';
import { FeatureLike } from 'ol/Feature';

interface MarkerManagerProps {
  map: Map | null;
  vectorSource: VectorSource | null;
  locations: LocationData[];
  showAllMarkers: boolean;
  onMarkerClick?: (location: LocationData)=> void;
}

export default function MarkerManager({
  map,
  vectorSource,
  locations,
  showAllMarkers,
  onMarkerClick,
}: MarkerManagerProps) {
  // 이전 locations 데이터를 저장하여 불필요한 업데이트 방지
  const prevLocationsRef = useRef<LocationData[]>([]);
  // 마커 스타일 생성 함수 (useCallback으로 메모이제이션)
  const createMarkerStyle = useCallback((feature: FeatureLike) => {
    const price = feature.get('price') as number;

    // 가격에 따른 마커 스타일 변경
    const color = price < 50000000 ? '#3498db'
      : price < 100000000 ? '#2ecc71'
        : price < 200000000 ? '#f39c12' : '#e74c3c';

    return new Style({
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({ color }),
        stroke: new Stroke({ color: '#ffffff', width: 2 }),
      }),
      text: new Text({
        text: feature.get('name'),
        offsetY: -15,
        font: '12px Arial',
        fill: new Fill({ color: '#333' }),
        stroke: new Stroke({ color: '#fff', width: 3 }),
      }),
    });
  }, []);

  // 위치 데이터가 실제로 변경되었는지 확인
  const locationsChanged = useCallback((newLocations: LocationData[], prevLocations: LocationData[]) => {
    if (newLocations.length !== prevLocations.length) return true;

    return newLocations.some((newLoc, index) => {
      const prevLoc = prevLocations[index];
      return !prevLoc
        || newLoc.name !== prevLoc.name
        || newLoc.lat !== prevLoc.lat
        || newLoc.lon !== prevLoc.lon
        || newLoc.price !== prevLoc.price;
    });
  }, []);

  // 마커 업데이트 (데이터가 실제로 변경되었을 때만 실행)
  useEffect(() => {
    console.log('마커 업데이트 useEffect 실행됨');
    console.log('전달받은 props:', {
      map: !!map,
      vectorSource: !!vectorSource,
      locationsLength: locations?.length || 0,
      showAllMarkers,
    });

    if (!map || !vectorSource) {
      console.warn('지도 또는 벡터 소스가 초기화되지 않았습니다.');
      console.warn('map:', map);
      console.warn('vectorSource:', vectorSource);
      return;
    }

    if (!locations || locations.length === 0) {
      // 데이터가 없으면 기존 마커만 제거
      if (vectorSource.getFeatures().length > 0) {
        console.log('위치 데이터가 없어서 기존 마커 제거');
        vectorSource.clear();
      }
      prevLocationsRef.current = [];
      return;
    }

    // 데이터가 변경되지 않았으면 마커 업데이트 건너뛰기
    if (!locationsChanged(locations, prevLocationsRef.current)) {
      console.log('위치 데이터가 변경되지 않았으므로 마커 업데이트 건너뜀');
      return;
    }

    console.log(`마커 업데이트 시작: 총 ${ locations.length }개의 위치 데이터`);

    // 기존 마커 제거
    console.log('기존 마커 제거 중...');
    vectorSource.clear();

    // 유효한 좌표가 있는 위치만 필터링
    const validLocations = locations.filter((loc) => loc.lat && loc.lon);
    console.log(`유효한 좌표가 있는 위치: ${ validLocations.length }/${ locations.length }`);

    if (validLocations.length === 0) {
      console.warn('유효한 좌표가 있는 위치 데이터가 없습니다.');
      prevLocationsRef.current = [...locations];
      return;
    }

    // 마커 추가
    console.log('마커 추가 중...');
    validLocations.forEach((location, index) => {
      if (location.lon && location.lat) {
        try {
          const coordinates = fromLonLat([location.lon, location.lat]);

          const feature = new Feature({
            geometry: new Point(coordinates),
            name: location.name,
            price: location.price,
            locationData: location,
          });

          // 스타일 설정
          feature.setStyle(createMarkerStyle(feature));
          vectorSource.addFeature(feature);
        } catch (err) {
          console.error(`마커 ${ index + 1 } 생성 중 오류:`, err);
        }
      }
    });

    console.log(`마커 추가 완료: ${ vectorSource.getFeatures().length }개`);

    // 지도 뷰 조정
    if (validLocations.length > 0) {
      try {
        const extent = vectorSource.getExtent();
        map.getView().fit(extent, { padding: [100, 100, 100, 100], maxZoom: 15 });
      } catch (err) {
        console.error('지도 뷰 조정 중 오류:', err);
      }
    }

    // 이전 데이터 저장
    prevLocationsRef.current = [...locations];
    console.log('마커 업데이트 완료');
  }, [map, vectorSource, locations, createMarkerStyle, locationsChanged, showAllMarkers]);

  // 마커 표시/숨김 토글
  useEffect(() => {
    if (!map) return;

    const layers = map.getLayers().getArray();
    const vectorLayer = layers.find((layer) => layer instanceof VectorLayer) as VectorLayer<VectorSource>;

    if (vectorLayer) {
      vectorLayer.setVisible(showAllMarkers);
    }
  }, [map, showAllMarkers]);

  // 클릭 이벤트 처리
  useEffect(() => {
    if (!map || !onMarkerClick) return;

    const clickHandler = (evt: any) => {
      console.log('지도 클릭 이벤트 발생');

      // 클릭한 위치에 마커가 있는지 확인
      const feature = map.forEachFeatureAtPixel(evt.pixel,
        (feature: FeatureLike) => feature,
        {
          hitTolerance: 5, // 클릭 허용 오차 범위 확대
          layerFilter: (layer) => layer instanceof VectorLayer, // 벡터 레이어만 대상으로
        },
      );

      if (feature) {
        console.log('마커 클릭됨:', feature.get('name'));
        const locationData = feature.get('locationData') as LocationData;
        onMarkerClick(locationData);
      } else {
        onMarkerClick(null as any);
      }
    };

    map.on('click', clickHandler);

    return () => {
      map.un('click', clickHandler);
    };
  }, [map, onMarkerClick]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
}
