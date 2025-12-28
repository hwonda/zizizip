'use client';

import { useEffect, useRef } from 'react';
import { ExtendedLocationData, LocationGroup } from '@/types';
import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { groupLocationsByCoordinates } from '@/utils/marker/markerGrouping';
import { locationsChanged } from '@/utils/marker/markerComparison';
import { useMarkerStyles } from '@/hooks/marker/useMarkerStyles';
import { useMarkerClustering } from '@/hooks/marker/useMarkerClustering';
import { useMarkerEvents } from '@/hooks/marker/useMarkerEvents';

interface MarkerManagerProps {
  map: Map | null;
  vectorSource: VectorSource | null;
  locations: ExtendedLocationData[];
  showAllMarkers: boolean;
  showMarkerLabels?: boolean;
  onMarkerClick?: (group: LocationGroup)=> void;
}

export default function MarkerManager({
  map,
  vectorSource,
  locations,
  showAllMarkers,
  showMarkerLabels = true,
  onMarkerClick,
}: MarkerManagerProps) {
  // 이전 locations 데이터를 저장하여 불필요한 업데이트 방지
  const prevLocationsRef = useRef<ExtendedLocationData[]>([]);

  // 마커 스타일 생성 훅
  const { createClusterStyle, createMarkerStyle } = useMarkerStyles();

  // 클러스터링 훅
  const { currentZoom } = useMarkerClustering({
    map,
    vectorSource,
    createClusterStyle,
    createMarkerStyle,
    showMarkerLabels,
  });

  // 마커 이벤트 처리 훅
  useMarkerEvents({
    map,
    currentZoom,
    onMarkerClick,
  });

  // 마커 업데이트 (데이터가 실제로 변경되었을 때만 실행)
  useEffect(() => {
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
        vectorSource.clear();
      }
      prevLocationsRef.current = [];
      return;
    }

    // 데이터가 변경되지 않았으면 마커 업데이트 건너뛰기
    if (!locationsChanged(locations, prevLocationsRef.current)) {
      return;
    }

    // 기존 마커 제거
    vectorSource.clear();

    // 유효한 좌표가 있는 위치만 필터링
    const validLocations = locations.filter((loc) => loc.lat && loc.lon);

    if (validLocations.length === 0) {
      console.warn('유효한 좌표가 있는 위치 데이터가 없습니다.');
      prevLocationsRef.current = [...locations];
      return;
    }

    // 좌표별로 그룹화
    const locationGroups = groupLocationsByCoordinates(validLocations);

    // 마커 추가 (그룹별로)
    locationGroups.forEach((group, index) => {
      try {
        const coordinates = fromLonLat([group.lon, group.lat]);

        // 첫 번째 유닛의 데이터셋 색상 사용
        const firstUnit = group.units[0];

        const feature = new Feature({
          geometry: new Point(coordinates),
          name: group.name,
          address: group.address,
          unitCount: group.units.length,
          datasetId: firstUnit.datasetId,
          datasetName: firstUnit.datasetName,
          datasetColor: firstUnit.datasetColor,
          locationGroup: group, // 전체 그룹 정보 저장
        });

        // 일반 마커 스타일 설정 (클러스터는 별도 useEffect에서 처리)
        feature.setStyle(createMarkerStyle(feature, showMarkerLabels));

        vectorSource.addFeature(feature);
      } catch (err) {
        console.error(`마커 그룹 ${ index + 1 } 생성 중 오류:`, err);
      }
    });

    // 지도 뷰 조정 (첫 로딩 시에만)
    if (validLocations.length > 0 && prevLocationsRef.current.length === 0) {
      try {
        const extent = vectorSource.getExtent();
        map.getView().fit(extent, { padding: [100, 100, 100, 100], maxZoom: 15 });
      } catch (err) {
        console.error('지도 뷰 조정 중 오류:', err);
      }
    }

    // 이전 데이터 저장
    prevLocationsRef.current = [...locations];
  }, [map, vectorSource, locations, createMarkerStyle, showAllMarkers, showMarkerLabels, currentZoom]);

  // 마커 표출/숨김 토글
  useEffect(() => {
    if (!map) return;

    const layers = map.getLayers().getArray();
    const vectorLayer = layers.find((layer) => layer instanceof VectorLayer) as VectorLayer<VectorSource>;

    if (vectorLayer) {
      vectorLayer.setVisible(showAllMarkers);
    }
  }, [map, showAllMarkers]);

  // 마커 라벨 표시/숨김 토글
  useEffect(() => {
    if (!vectorSource) return;

    // 모든 마커의 스타일 업데이트
    const features = vectorSource.getFeatures();
    features.forEach((feature) => {
      feature.setStyle(createMarkerStyle(feature, showMarkerLabels));
    });
  }, [vectorSource, showMarkerLabels, createMarkerStyle]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
}
