import { useEffect, useState, useRef, useCallback } from 'react';
import OLMap from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Cluster from 'ol/source/Cluster';
import Feature from 'ol/Feature';

interface UseMarkerClusteringParams {
  map: OLMap | null;
  vectorSource: VectorSource | null;
  createClusterStyle: (feature: any)=> any;
  createMarkerStyle: (feature: any, showLabels: boolean)=> any;
  showMarkerLabels: boolean;
}

// 줌 레벨 임계값 상수
const CLUSTER_ZOOM_THRESHOLD = 11;

/**
 * 마커 클러스터링 관련 훅
 * 줌 레벨에 따라 클러스터 모드와 일반 마커 모드를 전환합니다.
 * 각 데이터셋별로 별도의 클러스터 레이어를 생성합니다.
 */
export function useMarkerClustering({
  map,
  vectorSource,
  createClusterStyle,
  createMarkerStyle,
  showMarkerLabels,
}: UseMarkerClusteringParams) {
  const [currentZoom, setCurrentZoom] = useState(13);
  const datasetLayersRef = useRef<Map<string, { source: VectorSource; cluster: Cluster; layer: VectorLayer<Cluster> }>>(new Map());
  const syncTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

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

  // 유틸리티: 마커 레이어 가져오기
  const getMarkerLayers = useCallback(() => {
    if (!map) return [];
    const layers = map.getLayers().getArray();
    return layers.filter((layer) => layer instanceof VectorLayer && layer !== layers[0]) as VectorLayer<VectorSource | Cluster>[];
  }, [map]);

  // 유틸리티: 모든 마커 레이어 제거
  const removeAllMarkerLayers = useCallback(() => {
    if (!map) return;
    const markerLayers = getMarkerLayers();
    markerLayers.forEach((layer) => map.removeLayer(layer));
    datasetLayersRef.current.clear();
    console.log('🗑️  모든 마커 레이어 제거');
  }, [map, getMarkerLayers]);

  // 클러스터 레이어 생성
  const createClusterLayers = useCallback(() => {
    if (!map || !vectorSource) return;

    const features = vectorSource.getFeatures();
    if (features.length === 0) {
      console.log('🗑️  표출할 feature가 없어 클러스터 레이어를 생성하지 않음');
      return;
    }

    // 데이터셋별로 feature 그룹화
    const datasetGroups = new Map<string, Feature[]>();
    features.forEach((feature) => {
      const datasetId = feature.get('datasetId') as string;
      if (!datasetGroups.has(datasetId)) {
        datasetGroups.set(datasetId, []);
      }
      datasetGroups.get(datasetId)!.push(feature);
    });

    console.log(`📊 ${ datasetGroups.size }개 데이터셋으로 클러스터 분리`);

    // 각 데이터셋별로 클러스터 레이어 생성
    datasetGroups.forEach((datasetFeatures, datasetId) => {
      const datasetSource = new VectorSource({ features: datasetFeatures });
      const clusterSource = new Cluster({ source: datasetSource, distance: 30 });
      const clusterLayer = new VectorLayer({ source: clusterSource, style: createClusterStyle });

      datasetLayersRef.current.set(datasetId, {
        source: datasetSource,
        cluster: clusterSource,
        layer: clusterLayer,
      });

      map.addLayer(clusterLayer);
      console.log(`✅ 데이터셋 ${ datasetId } 클러스터 레이어 추가 (${ datasetFeatures.length }개 feature)`);
    });

    console.log('✅ 모든 클러스터 레이어 활성화');
  }, [map, vectorSource, createClusterStyle]);

  // 일반 마커 레이어 생성
  const createMarkerLayer = useCallback(() => {
    if (!map || !vectorSource) return;

    const features = vectorSource.getFeatures();
    if (features.length === 0) {
      console.log('🗑️  표출할 feature가 없어 마커 레이어를 생성하지 않음');
      return;
    }

    const normalLayer = new VectorLayer({ source: vectorSource });
    map.addLayer(normalLayer);

    // 마커 스타일 적용
    features.forEach((feature) => {
      feature.setStyle(createMarkerStyle(feature, showMarkerLabels));
    });

    console.log(`✅ 일반 마커 레이어 활성화 (${ features.length }개 feature)`);
  }, [map, vectorSource, createMarkerStyle, showMarkerLabels]);

  // 핵심: 현재 상태에 맞게 레이어 동기화
  const syncLayersWithCurrentState = useCallback(() => {
    if (!map || !vectorSource) return;

    const zoom = map.getView().getZoom();
    if (zoom === undefined) return;

    const features = vectorSource.getFeatures();
    const markerLayers = getMarkerLayers();

    // 목표 상태 결정
    const shouldShowCluster = zoom <= CLUSTER_ZOOM_THRESHOLD && features.length > 0;
    const shouldShowMarker = zoom > CLUSTER_ZOOM_THRESHOLD && features.length > 0;
    const shouldShowNothing = features.length === 0;

    // 현재 상태 확인
    const hasLayers = markerLayers.length > 0;
    const isCurrentlyCluster = hasLayers && markerLayers[0].getSource() instanceof Cluster;
    const isCurrentlyMarker = hasLayers && !(markerLayers[0].getSource() instanceof Cluster);

    console.log(`🔄 레이어 동기화: 줌=${ zoom.toFixed(1) }, features=${ features.length }, 목표=${ shouldShowCluster ? '클러스터' : shouldShowMarker ? '마커' : '없음' }, 현재=${ isCurrentlyCluster ? '클러스터' : isCurrentlyMarker ? '마커' : '없음' }`);

    // 상태 전환 로직
    if (shouldShowCluster && !isCurrentlyCluster) {
      // 클러스터 모드로 전환
      console.log('→ 클러스터 모드로 전환');
      removeAllMarkerLayers();
      createClusterLayers();
    } else if (shouldShowMarker && !isCurrentlyMarker) {
      // 일반 마커 모드로 전환
      console.log('→ 일반 마커 모드로 전환');
      removeAllMarkerLayers();
      createMarkerLayer();
    } else if (shouldShowNothing && hasLayers) {
      // 레이어 제거
      console.log('→ 모든 레이어 제거');
      removeAllMarkerLayers();
    } else if (shouldShowCluster && isCurrentlyCluster) {
      // 이미 클러스터 모드 - 데이터 변경 시 재생성
      console.log('→ 클러스터 레이어 재생성');
      removeAllMarkerLayers();
      createClusterLayers();
    } else {
      console.log('→ 상태 변경 없음');
    }
  }, [map, vectorSource, getMarkerLayers, removeAllMarkerLayers, createClusterLayers, createMarkerLayer]);

  // vectorSource 변경 감지 (debounced)
  useEffect(() => {
    if (!map || !vectorSource) return;

    const handleFeaturesChange = () => {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        console.log('🔔 vectorSource 변경 감지');
        syncLayersWithCurrentState();
      }, 100);
    };

    vectorSource.on('addfeature', handleFeaturesChange);
    vectorSource.on('removefeature', handleFeaturesChange);
    vectorSource.on('clear', handleFeaturesChange);

    return () => {
      clearTimeout(syncTimerRef.current);
      vectorSource.un('addfeature', handleFeaturesChange);
      vectorSource.un('removefeature', handleFeaturesChange);
      vectorSource.un('clear', handleFeaturesChange);
    };
  }, [map, vectorSource, syncLayersWithCurrentState]);

  // 줌 레벨 변경 시 레이어 동기화
  useEffect(() => {
    if (!map || !vectorSource) return;

    console.log(`🔍 줌 레벨 변경: ${ currentZoom }`);
    syncLayersWithCurrentState();
  }, [map, vectorSource, currentZoom, syncLayersWithCurrentState]);

  return {
    currentZoom,
    datasetLayersRef,
  };
}
