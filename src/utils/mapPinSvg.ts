/**
 * MapPin SVG를 data URL로 변환하는 유틸리티 함수
 * OpenLayers의 Icon에서 사용하기 위함
 */
export function createMapPinSVGDataUrl(color: string, size: number = 24): string {
  const svg = `
    <svg width="${ size }" height="${ size }" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.3" flood-color="#000000"/>
        </filter>
      </defs>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" 
            fill="${ color }" 
            stroke="#ffffff" 
            stroke-width="2"
            filter="url(#drop-shadow)"/>
      <circle cx="12" cy="10" r="3" 
              fill="#ffffff" 
              stroke="${ color }" 
              stroke-width="1"/>
    </svg>
  `;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
