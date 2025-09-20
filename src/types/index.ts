// 위치 데이터 타입 정의
export interface LocationData {
  name: string;
  address: string;
  price: number;
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
