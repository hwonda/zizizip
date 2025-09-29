'use client';

import { useEffect, useCallback, useRef } from 'react';
import { ExtendedLocationData } from '@/types';
import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke, Text, Icon } from 'ol/style';
import { FeatureLike } from 'ol/Feature';
import { createMapPinSVGDataUrl } from '@/utils/mapPinSvg';

interface MarkerManagerProps {
  map: Map | null;
  vectorSource: VectorSource | null;
  locations: ExtendedLocationData[];
  showAllMarkers: boolean;
  onMarkerClick?: (location: ExtendedLocationData)=> void;
}

export default function MarkerManager({
  map,
  vectorSource,
  locations,
  showAllMarkers,
  onMarkerClick,
}: MarkerManagerProps) {
  // 이전 locations 데이터를 저장하여 불필요한 업데이트 방지
  const prevLocationsRef = useRef<ExtendedLocationData[]>([]);

  // MapPin 모양 아이콘 SVG 생성 함수 (공통 유틸리티 사용)
  const createMapPinSVG = useCallback((color: string) => {
    return createMapPinSVGDataUrl(color, 24);
  }, []);

  // 마커 스타일 생성 함수 (데이터셋별 색상)
  const createMarkerStyle = useCallback((feature: FeatureLike) => {
    const datasetColor = feature.get('datasetColor') as string || '#3498db';

    // MapPin 모양 아이콘 생성
    const iconSrc = createMapPinSVG(datasetColor);

    return new Style({
      image: new Icon({
        src: iconSrc,
        scale: 1,
        anchor: [0.5, 1], // 물방울 끝점이 정확한 위치를 가리키도록
      }),
      text: new Text({
        text: feature.get('name'),
        offsetY: 10, // 마커 아래쪽에 표시
        font: '12px Arial',
        fill: new Fill({ color: '#333' }),
        stroke: new Stroke({ color: '#fff', width: 3 }),
        textAlign: 'center',
      }),
    });
  }, [createMapPinSVG]);

  // 위치 데이터가 실제로 변경되었는지 확인
  const locationsChanged = useCallback((newLocations: ExtendedLocationData[], prevLocations: ExtendedLocationData[]) => {
    console.log(`🔍 데이터 변경 확인: 새로운 ${ newLocations.length }개 vs 이전 ${ prevLocations.length }개`);

    if (newLocations.length !== prevLocations.length) {
      console.log('✅ 배열 길이가 다름 → 변경됨');
      return true;
    }

    const hasChanged = newLocations.some((newLoc, index) => {
      const prevLoc = prevLocations[index];
      return !prevLoc
        || newLoc.name !== prevLoc.name
        || newLoc.lat !== prevLoc.lat
        || newLoc.lon !== prevLoc.lon
        || newLoc.price !== prevLoc.price
        || newLoc.datasetId !== prevLoc.datasetId;
    });

    console.log(`🔍 내용 비교 결과: ${ hasChanged ? '변경됨' : '변경되지 않음' }`);
    return hasChanged;
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
      const currentMarkerCount = vectorSource.getFeatures().length;
      if (currentMarkerCount > 0) {
        console.log(`🗑️  빈 배열 수신, 기존 마커 ${ currentMarkerCount }개 제거`);
        vectorSource.clear();
        console.log('✅ 마커 제거 완료');
      } else {
        console.log('📍 빈 배열 수신했지만 제거할 마커가 없음');
      }
      prevLocationsRef.current = [];
      console.log('📝 prevLocationsRef 빈 배열로 업데이트됨');
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
            datasetId: location.datasetId,
            datasetName: location.datasetName,
            datasetColor: location.datasetColor,
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
        const locationData = feature.get('locationData') as ExtendedLocationData;
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
