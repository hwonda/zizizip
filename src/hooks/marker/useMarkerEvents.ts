import { useEffect } from 'react';
import OLMap from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import { FeatureLike } from 'ol/Feature';
import { LocationGroup } from '@/types';
import Feature from 'ol/Feature';

interface UseMarkerEventsParams {
  map: OLMap | null;
  currentZoom: number;
  onMarkerClick?: (group: LocationGroup)=> void;
}

/**
 * 마커 이벤트 처리 관련 훅
 * 클릭 및 호버 이벤트를 처리합니다.
 */
export function useMarkerEvents({
  map,
  currentZoom,
  onMarkerClick,
}: UseMarkerEventsParams) {
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
}
