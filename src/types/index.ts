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
