import { useCallback } from 'react';
import { Style, Fill, Stroke, Text, Icon, Circle } from 'ol/style';
import { FeatureLike } from 'ol/Feature';
import { createMapPinSVGDataUrl } from '@/utils/mapPinSvg';

/**
 * 마커 스타일 생성 관련 훅
 */
export function useMarkerStyles() {
  // MapPin 모양 아이콘 SVG 생성 함수
  const createMapPinSVG = useCallback((color: string) => {
    return createMapPinSVGDataUrl(color, 24);
  }, []);

  // 클러스터 스타일 생성 함수 (줌 레벨 11 이하)
  const createClusterStyle = useCallback((feature: FeatureLike) => {
    const features = feature.get('features');
    const clusterSize = features.length; // LocationGroup 개수

    // 클러스터 내 첫 번째 feature의 데이터셋 색상 가져오기
    const firstFeature = features[0];
    const datasetColor = firstFeature.get('datasetColor') as string || '#3498db';

    // hex를 rgba로 변환하는 헬퍼 함수
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${ r }, ${ g }, ${ b }, ${ alpha })`;
    };

    // 클러스터 크기에 따른 원 크기 계산 (최소 20, 최대 50)
    const baseRadius = 20;
    const maxRadius = 50;
    const radius = Math.min(baseRadius + clusterSize * 2, maxRadius);

    return new Style({
      image: new Circle({
        radius: radius,
        fill: new Fill({
          color: hexToRgba(datasetColor, 0.5), // 데이터셋 색상 50% 투명도
        }),
        stroke: new Stroke({
          color: hexToRgba(datasetColor, 0.8), // 데이터셋 색상 80% 투명도
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

  return {
    createClusterStyle,
    createMarkerStyle,
  };
}
