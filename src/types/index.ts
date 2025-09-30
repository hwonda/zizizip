// 위치 데이터 타입 정의
export interface LocationData {
  // 필수 필드
  name: string;
  address: string;

  // 선택적 필드들
  building?: string; // 동
  unit?: string; // 호
  exclusiveArea?: number; // 전용 면적
  livingArea?: number; // 주거공용 면적
  totalArea?: number; // 면적 계
  rooms?: number; // 방 수
  floor?: number; // 층수
  elevator?: boolean; // 승강기 유무
  houseType?: string; // 주택유형

  price?: {
    sale?: number; // 매매가
    deposit?: number; // 임대보증금
    monthly?: number; // 월임대료
  };

  // 좌표
  lat?: number;
  lon?: number;
}

// VWorld 지오코딩 응답 타입 정의
export interface VWorldGeocodeResponse {
  response: {
    status: string;
    record: {
      total: number;
    };
    result?: {
      items: Array<{
        point: {
          x: string; // 경도
          y: string; // 위도
        };
      }>;
    };
  };
}

// 업로드 응답 타입 정의
export interface UploadResponse {
  success: boolean;
  data?: LocationData[];
  error?: string;
}

// 데이터셋 관리를 위한 새로운 타입들
export interface LocationDataset {
  id: string;
  name: string;
  uploadedAt: Date;
  data: LocationData[];
  color: string;
}

// 확장된 위치 데이터 (데이터셋 정보 포함)
export interface ExtendedLocationData extends LocationData {
  datasetId: string;
  datasetName: string;
  datasetColor: string;
}

// 같은 좌표의 여러 유닛을 그룹화하는 타입
export interface LocationGroup {
  id: string; // 좌표 기반의 고유 ID (lat_lon 형태)
  lat: number;
  lon: number;
  units: ExtendedLocationData[]; // 같은 좌표의 여러 유닛들
  // 대표 정보 (첫 번째 유닛의 정보)
  name: string;
  address: string;
  houseType?: string;
  elevator?: boolean;
}
