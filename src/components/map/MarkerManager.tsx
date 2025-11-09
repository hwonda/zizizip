'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { ExtendedLocationData, LocationGroup } from '@/types';
import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Cluster from 'ol/source/Cluster';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke, Text, Icon, Circle } from 'ol/style';
import { FeatureLike } from 'ol/Feature';
import { createMapPinSVGDataUrl } from '@/utils/mapPinSvg';

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

  // 클러스터 소스 참조
  const clusterSourceRef = useRef<Cluster | null>(null);

  // 현재 줌 레벨 상태
  const [currentZoom, setCurrentZoom] = useState(13);

  // MapPin 모양 아이콘 SVG 생성 함수 (공통 유틸리티 사용)
  const createMapPinSVG = useCallback((color: string) => {
    return createMapPinSVGDataUrl(color, 24);
  }, []);

  // 좌표별로 위치 데이터 그룹화 함수
  const groupLocationsByCoordinates = useCallback((locations: ExtendedLocationData[]): LocationGroup[] => {
    const groups: Record<string, LocationGroup> = {};

    locations.forEach((location) => {
      if (!location.lat || !location.lon) return;

      const coordKey = `${ location.lat }_${ location.lon }`;

      if (groups[coordKey]) {
        groups[coordKey].units.push(location);
      } else {
        groups[coordKey] = {
          id: coordKey,
          lat: location.lat,
          lon: location.lon,
          units: [location],
          name: location.name,
          address: location.address,
          houseType: location.houseType,
          elevator: location.elevator,
        };
      }
    });

    return Object.values(groups);
  }, []);

  // 클러스터 스타일 생성 함수 (줌 레벨 11 이하)
  const createClusterStyle = useCallback((feature: FeatureLike) => {
    const features = feature.get('features') as Feature[];
    const clusterSize = features.length; // LocationGroup 개수

    // 클러스터 크기에 따른 원 크기 계산 (최소 20, 최대 50)
    const baseRadius = 20;
    const maxRadius = 50;
    const radius = Math.min(baseRadius + clusterSize * 2, maxRadius);

    return new Style({
      image: new Circle({
        radius: radius,
        fill: new Fill({
          color: 'rgba(254, 104, 29, 0.5)', // primary 색상 50% 투명도
        }),
        stroke: new Stroke({
          color: 'rgba(254, 104, 29, 0.8)',
          width: 2,
        }),
      }),
      text: new Text({
        text: clusterSize.toString(),
        fill: new Fill({ color: '#fff' }),
        font: 'bold 14px Arial',
      }),
    });
  }, []);

  // 마커 스타일 생성 함수 (줌 레벨 12 이상, 그룹 정보 포함)
  const createMarkerStyle = useCallback((feature: FeatureLike, showLabels: boolean) => {
    const datasetColor = feature.get('datasetColor') as string || '#3498db';
    const unitCount = feature.get('unitCount') as number || 1;

    // MapPin 모양 아이콘 생성
    const iconSrc = createMapPinSVG(datasetColor);

    const styles = [
      // 메인 마커 아이콘
      new Style({
        image: new Icon({
          src: iconSrc,
          scale: 1,
          anchor: [0.5, 1], // 물방울 끝점이 정확한 위치를 가리키도록
        }),
        text: showLabels ? new Text({
          text: feature.get('name'),
          offsetY: 10, // 마커 아래쪽에 표출
          font: '12px Arial',
          fill: new Fill({ color: '#333' }),
          stroke: new Stroke({ color: '#fff', width: 3 }),
          textAlign: 'center',
        }) : undefined,
      }),
    ];

    // 유닛이 여러 개인 경우 개수 배지 추가
    if (unitCount > 1) {
      styles.push(
        new Style({
          image: new Icon({
            src: `data:image/svg+xml;charset=utf-8,${ encodeURIComponent(`
              <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="10" fill="rgb(254, 104, 29)" stroke="#fff" stroke-width="2"/>
                <text x="10" y="14" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">${ unitCount }</text>
              </svg>
            `) }`,
            scale: 0.8,
            anchor: [0, 1], // 마커 우하단에 배치
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
          }),
        }),
      );
    }

    return styles;
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

  // 줌 레벨 변경 감지
  useEffect(() => {
    if (!map) return;

    const handleZoomChange = () => {
      const zoom = map.getView().getZoom();
      if (zoom !== undefined) {
        console.log(`🔍 현재 줌 레벨: ${ zoom }`);
        setCurrentZoom(zoom);
      }
    };

    // 초기 줌 레벨 설정
    handleZoomChange();

    // 줌 변경 이벤트 리스너 등록
    map.getView().on('change:resolution', handleZoomChange);

    return () => {
      map.getView().un('change:resolution', handleZoomChange);
    };
  }, [map]);

  // 줌 레벨에 따른 클러스터/일반 레이어 전환
  useEffect(() => {
    if (!map || !vectorSource) return;

    console.log(`🔄 줌 레벨 ${ currentZoom }: 레이어 전환 확인`);

    const layers = map.getLayers().getArray();
    let vectorLayer = layers.find((layer) => layer instanceof VectorLayer) as VectorLayer<VectorSource | Cluster>;

    if (!vectorLayer) {
      console.warn('⚠️  벡터 레이어를 찾을 수 없음');
      return;
    }

    const currentSource = vectorLayer.getSource();
    const isClusterLayer = currentSource instanceof Cluster;

    if (currentZoom <= 11 && !isClusterLayer) {
      // 클러스터 모드로 전환
      console.log('🔄 클러스터 모드로 전환');

      if (!clusterSourceRef.current || clusterSourceRef.current.getSource() !== vectorSource) {
        console.log('🔄 클러스터 소스 생성');
        clusterSourceRef.current = new Cluster({
          source: vectorSource,
          distance: 30,
        });
      }

      const clusterLayer = new VectorLayer({
        source: clusterSourceRef.current,
        style: createClusterStyle,
      });

      map.removeLayer(vectorLayer);
      map.addLayer(clusterLayer);
      console.log('✅ 클러스터 레이어 활성화');
    } else if (currentZoom > 11 && isClusterLayer) {
      // 일반 모드로 전환
      console.log('🔄 일반 마커 모드로 전환');

      const normalLayer = new VectorLayer({
        source: vectorSource,
      });

      map.removeLayer(vectorLayer);
      map.addLayer(normalLayer);
      console.log('✅ 일반 마커 레이어 활성화');

      // 기존 마커들의 스타일 다시 적용
      const features = vectorSource.getFeatures();
      features.forEach((feature) => {
        feature.setStyle(createMarkerStyle(feature, showMarkerLabels));
      });
    }
  }, [map, vectorSource, currentZoom, createClusterStyle, createMarkerStyle, showMarkerLabels]);

  // 마커 업데이트 (데이터가 실제로 변경되었을 때만 실행)
  useEffect(() => {
    console.log('마커 업데이트 useEffect 실행됨');
    console.log('전달받은 props:', {
      map: !!map,
      vectorSource: !!vectorSource,
      locationsLength: locations?.length || 0,
      showAllMarkers,
      currentZoom,
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

    // 좌표별로 그룹화
    const locationGroups = groupLocationsByCoordinates(validLocations);
    console.log(`그룹화된 위치: ${ locationGroups.length }개 그룹`);

    // 마커 추가 (그룹별로)
    console.log('마커 추가 중...');
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

    console.log(`마커 추가 완료: ${ vectorSource.getFeatures().length }개`);

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
    console.log('마커 업데이트 완료');
  }, [map, vectorSource, locations, createMarkerStyle, locationsChanged, showAllMarkers, groupLocationsByCoordinates, showMarkerLabels]);

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

    console.log(`🏷️  마커 라벨 ${ showMarkerLabels ? '표시' : '숨김' }`);

    // 모든 마커의 스타일 업데이트
    const features = vectorSource.getFeatures();
    features.forEach((feature) => {
      feature.setStyle(createMarkerStyle(feature, showMarkerLabels));
    });
  }, [vectorSource, showMarkerLabels, createMarkerStyle]);

  // 마우스 포인터 커서 변경 (클러스터 및 마커 hover)
  useEffect(() => {
    if (!map) return;

    const handlePointerMove = (evt: any) => {
      const pixel = map.getEventPixel(evt.originalEvent);
      const feature = map.forEachFeatureAtPixel(pixel,
        (feature: FeatureLike) => feature,
        {
          hitTolerance: 5,
          layerFilter: (layer) => layer instanceof VectorLayer,
        },
      );

      // 마커나 클러스터 위에 있으면 포인터 커서
      const mapElement = map.getTargetElement() as HTMLElement;
      if (feature) {
        mapElement.style.cursor = 'pointer';
      } else {
        mapElement.style.cursor = '';
      }
    };

    map.on('pointermove', handlePointerMove);

    return () => {
      map.un('pointermove', handlePointerMove);
    };
  }, [map]);

  // 클릭 이벤트 처리 (클러스터 및 일반 마커)
  useEffect(() => {
    if (!map || !onMarkerClick) return;

    const clickHandler = (evt: any) => {
      console.log('지도 클릭 이벤트 발생');

      // 팝업 요소인지 확인 (팝업 내부 클릭은 무시)
      const isPopupClick = evt.originalEvent.target.closest('.ol-popup');
      if (isPopupClick) {
        console.log('팝업 내부 클릭 감지, 무시함');
        return;
      }

      // 클릭한 위치에 마커가 있는지 확인
      const feature = map.forEachFeatureAtPixel(evt.pixel,
        (feature: FeatureLike) => feature,
        {
          hitTolerance: 5, // 클릭 허용 오차 범위 확대
          layerFilter: (layer) => layer instanceof VectorLayer, // 벡터 레이어만 대상으로
        },
      );

      if (feature) {
        // 클러스터인지 확인
        const features = feature.get('features');
        if (features && features.length > 1 && currentZoom <= 11) {
          // 클러스터 클릭: 해당 영역으로 줌인
          console.log(`클러스터 클릭됨: ${ features.length }개 그룹`);

          const extent = feature.getGeometry()?.getExtent();
          if (extent) {
            // 클러스터 영역으로 줌인
            map.getView().fit(extent, {
              duration: 500,
              padding: [100, 100, 100, 100],
              maxZoom: 14,
            });
          }
        } else if (features && features.length === 1) {
          // 단일 마커 (클러스터 안에 하나만 있는 경우)
          const singleFeature = features[0] as Feature;
          console.log('단일 마커 (클러스터) 클릭됨:', singleFeature.get('name'));
          const locationGroup = singleFeature.get('locationGroup') as LocationGroup;
          onMarkerClick(locationGroup);
        } else {
          // 일반 마커 클릭
          console.log('마커 클릭됨:', feature.get('name'));
          const locationGroup = feature.get('locationGroup') as LocationGroup;
          onMarkerClick(locationGroup);
        }
      } else {
        onMarkerClick(null as any);
      }
    };

    map.on('click', clickHandler);

    return () => {
      map.un('click', clickHandler);
    };
  }, [map, onMarkerClick, currentZoom]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
}
