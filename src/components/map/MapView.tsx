'use client';

import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import 'ol/ol.css';

interface MapViewProps {
  onMapInitialized: (map: Map, vectorSource: VectorSource)=> void;
}

export default function MapView({ onMapInitialized }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  // 지도 초기화 (한 번만 실행)
  useEffect(() => {
    console.log('지도 초기화 useEffect 실행');
    if (!mapRef.current) {
      console.warn('지도 DOM 요소가 없습니다');
      return;
    }

    if (mapInstanceRef.current) {
      console.log('지도가 이미 초기화되어 있습니다');
      return;
    }

    // 베이스맵 레이어 (VWorld)
    const baseLayer = new TileLayer({
      source: new XYZ({
        url: `https://api.vworld.kr/req/wmts/1.0.0/${ process.env.NEXT_PUBLIC_VWORLD_API_KEY }/Base/{z}/{y}/{x}.png`,
        crossOrigin: 'anonymous',
        attributions: ['VWorld 베이스맵'],
      }),
    });

    console.log('베이스맵 레이어 생성 완료');

    // 벡터 레이어 (마커용)
    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

    // 지도 생성
    const map = new Map({
      target: mapRef.current,
      layers: [baseLayer, vectorLayer],
      controls: defaultControls(),
      view: new View({
        center: fromLonLat([127.0, 37.5]), // 서울 중심
        zoom: 13,
      }),
    });

    mapInstanceRef.current = map;
    console.log('지도 초기화 완료');

    // 지도 렌더링 완료 이벤트 리스너 추가
    map.once('rendercomplete', () => {
      console.log('지도 렌더링 완료');
      onMapInitialized(map, vectorSource);
    });

    return () => {
      console.log('지도 정리 중...');
      map.dispose();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 의존성 배열을 비워서 한 번만 실행되도록 수정

  // onMapInitialized 함수 변경 시 별도 처리
  useEffect(() => {
    if (mapInstanceRef.current && onMapInitialized) {
      // 지도가 이미 초기화되어 있으면 벡터 소스를 찾아서 콜백 실행
      const layers = mapInstanceRef.current.getLayers().getArray();
      const vectorLayer = layers.find((layer) => layer instanceof VectorLayer) as VectorLayer<VectorSource>;

      if (vectorLayer) {
        const vectorSource = vectorLayer.getSource();
        if (vectorSource) {
          console.log('기존 지도에 대해 onMapInitialized 콜백 실행');
          onMapInitialized(mapInstanceRef.current, vectorSource);
        }
      }
    }
  }, [onMapInitialized]);

  return <div ref={mapRef} className="w-full h-full" />;
}
