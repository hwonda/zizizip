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

  // 클러스터 레이어를 재생성하는 함수
  const rebuildClusterLayers = useCallback(() => {
    if (!map || !vectorSource) return;

    const layers = map.getLayers().getArray();
    const markerLayers = layers.filter((layer) => layer instanceof VectorLayer && layer !== layers[0]) as VectorLayer<VectorSource | Cluster>[];

    // 기존 클러스터 레이어들 제거
    markerLayers.forEach((layer) => map.removeLayer(layer));
    datasetLayersRef.current.clear();

    // 데이터셋별로 feature 그룹화
    const features = vectorSource.getFeatures();

    if (features.length === 0) {
      console.log('🗑️  표출할 feature가 없어 클러스터 레이어를 생성하지 않음');
      return;
    }

    const datasetGroups = new Map<string, Feature[]>();

    features.forEach((feature) => {
      const datasetId = feature.get('datasetId') as string;
      if (!datasetGroups.has(datasetId)) {
        datasetGroups.set(datasetId, []);
      }
      datasetGroups.get(datasetId)!.push(feature);
    });

    console.log(`📊 ${ datasetGroups.size }개 데이터셋으로 분리`);

    // 각 데이터셋별로 클러스터 레이어 생성
    datasetGroups.forEach((datasetFeatures, datasetId) => {
      const datasetSource = new VectorSource({
        features: datasetFeatures,
      });

      const clusterSource = new Cluster({
        source: datasetSource,
        distance: 30,
      });

      const clusterLayer = new VectorLayer({
        source: clusterSource,
        style: createClusterStyle,
      });

      datasetLayersRef.current.set(datasetId, {
        source: datasetSource,
        cluster: clusterSource,
        layer: clusterLayer,
      });

      map.addLayer(clusterLayer);
      console.log(`✅ 데이터셋 ${ datasetId } 클러스터 레이어 추가 (${ datasetFeatures.length }개 feature)`);
    });

    console.log('✅ 모든 데이터셋 클러스터 레이어 활성화');
  }, [map, vectorSource, createClusterStyle]);

  // vectorSource의 feature 변경 감지 (데이터셋 on/off 시)
  useEffect(() => {
    if (!map || !vectorSource) return;

    // feature 변경 완료 후 실행할 타이머
    let updateTimer: NodeJS.Timeout;

    const handleFeaturesChange = () => {
      // 현재 줌 레벨이 클러스터 범위인지 확인
      const currentZoomLevel = map.getView().getZoom();
      if (currentZoomLevel === undefined || currentZoomLevel > 11) {
        // 일반 마커 모드에서는 처리하지 않음
        return;
      }

      // 짧은 debounce로 clear + addfeature가 연속으로 발생할 때 한 번만 실행
      clearTimeout(updateTimer);
      updateTimer = setTimeout(() => {
        console.log('🔄 vectorSource 변경 감지 - 클러스터 레이어 재생성');
        rebuildClusterLayers();
      }, 50);
    };

    // vectorSource의 변경 이벤트 리스너 등록
    // clear 이벤트도 포함하여 모든 변경사항 감지
    vectorSource.on('addfeature', handleFeaturesChange);
    vectorSource.on('removefeature', handleFeaturesChange);
    vectorSource.on('clear', handleFeaturesChange);

    return () => {
      clearTimeout(updateTimer);
      vectorSource.un('addfeature', handleFeaturesChange);
      vectorSource.un('removefeature', handleFeaturesChange);
      vectorSource.un('clear', handleFeaturesChange);
    };
  }, [map, vectorSource, rebuildClusterLayers]);

  // 줌 레벨에 따른 클러스터/일반 레이어 전환
  useEffect(() => {
    if (!map || !vectorSource) return;

    console.log(`🔄 줌 레벨 ${ currentZoom }: 레이어 전환 확인`);

    const layers = map.getLayers().getArray();
    const markerLayers = layers.filter((layer) => layer instanceof VectorLayer && layer !== layers[0]) as VectorLayer<VectorSource | Cluster>[];

    if (markerLayers.length === 0) {
      console.warn('⚠️  마커 레이어를 찾을 수 없음');
      return;
    }

    const firstLayer = markerLayers[0];
    const currentSource = firstLayer.getSource();
    const isClusterMode = currentSource instanceof Cluster;

    if (currentZoom <= 11 && !isClusterMode) {
      // 클러스터 모드로 전환
      console.log('🔄 데이터셋별 클러스터 모드로 전환');
      rebuildClusterLayers();
    } else if (currentZoom > 11 && isClusterMode) {
      // 일반 모드로 전환
      console.log('🔄 일반 마커 모드로 전환');

      // 기존 클러스터 레이어 제거
      markerLayers.forEach((layer) => map.removeLayer(layer));
      datasetLayersRef.current.clear();

      // 단일 일반 레이어로 복원
      const normalLayer = new VectorLayer({
        source: vectorSource,
      });

      map.addLayer(normalLayer);
      console.log('✅ 일반 마커 레이어 활성화');

      // 기존 마커들의 스타일 다시 적용
      const features = vectorSource.getFeatures();
      features.forEach((feature) => {
        feature.setStyle(createMarkerStyle(feature, showMarkerLabels));
      });
    }
  }, [map, vectorSource, currentZoom, createMarkerStyle, showMarkerLabels, rebuildClusterLayers]);

  return {
    currentZoom,
    datasetLayersRef,
  };
}
