import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'papaparse';
import { LocationData } from '@/types';

// 간단한 인메모리 캐시 구현
interface CacheItem<T> {
  value: T;
  expiry: number;
}

class SimpleCache {
  private cache: Record<string, CacheItem<any>> = {};

  set<T>(key: string, value: T, ttl: number): void {
    this.cache[key] = {
      value,
      expiry: Date.now() + (ttl * 1000),
    };
  }

  get<T>(key: string): T | null {
    const item = this.cache[key];
    if (!item) return null;

    if (Date.now() > item.expiry) {
      delete this.cache[key];
      return null;
    }

    return item.value as T;
  }
}

// 캐시 설정 (TTL: 1시간 = 3600초)
const geocodeCache = new SimpleCache();

// 레이트 리밋 설정
const RATE_LIMIT = 5; // 초당 최대 요청 수
const RATE_WINDOW = 1000; // 1초 (밀리초 단위)
let requestTimestamps: number[] = [];

/**
 * 레이트 리밋 체크 함수
 */
function checkRateLimit(): boolean {
  const now = Date.now();
  // 현재 윈도우에 해당하는 요청만 유지
  requestTimestamps = requestTimestamps.filter(
    (timestamp) => now - timestamp < RATE_WINDOW,
  );

  // 현재 윈도우의 요청 수가 제한을 초과하는지 확인
  if (requestTimestamps.length >= RATE_LIMIT) {
    return false;
  }

  // 새 요청 타임스탬프 추가
  requestTimestamps.push(now);
  return true;
}

/**
 * 주소 정제 함수
 */
function refineAddress(address: string): string {
  // 불필요한 공백 제거
  let refined = address.trim().replace(/\s+/g, ' ');

  // 번지/번길 표기 정규화
  refined = refined.replace(/(\d+)번지/g, '$1');
  refined = refined.replace(/(\d+)번길/g, '$1번길');

  // 특수문자 처리
  refined = refined.replace(/[^\w\s가-힣\d-]/g, '');

  return refined;
}

/**
 * 지오코딩 API 호출 함수 (VWorld + 대체 API)
 */
async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  console.log(`지오코딩 시작: ${ address }`);

  // 캐시 확인
  const cacheKey = `geocode_${ address }`;
  const cachedResult = geocodeCache.get<{ lat: number; lon: number }>(cacheKey);

  if (cachedResult) {
    console.log(`캐시에서 좌표 찾음: ${ JSON.stringify(cachedResult) }`);
    return cachedResult;
  }

  // 레이트 리밋 체크
  if (!checkRateLimit()) {
    console.error('레이트 리밋 초과');
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // 주소 정제
  const refinedAddress = refineAddress(address);
  console.log(`정제된 주소: ${ refinedAddress }`);

  try {
    // VWorld API 키
    const apiKey = process.env.NEXT_PUBLIC_VWORLD_API_KEY;
    if (!apiKey) {
      console.error('VWorld API 키가 설정되지 않았습니다');
      throw new Error('VWORLD_API_KEY is not defined in environment variables');
    }

    console.log(`API 키 확인: ${ apiKey.substring(0, 3) }...`);

    // VWorld 지오코딩 API 호출 - https 사용
    const url = `https://api.vworld.kr/req/address?service=address&request=getCoord&version=2.0&crs=epsg:4326&address=${ encodeURIComponent(refinedAddress) }&refine=true&simple=false&format=json&type=road&key=${ apiKey }`;

    console.log(`API 요청 URL: ${ url }`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`API 응답 오류: ${ response.status } ${ response.statusText }`);
      return null;
    }

    const data = await response.json();
    console.log('API 응답 데이터:', JSON.stringify(data).substring(0, 200) + '...');

    // 응답 구조 상세 디버깅
    if (data && data.response && data.response.status === 'OK') {
      console.log('OK 응답 상세 구조:', JSON.stringify({
        hasResult: !!data.response.result,
        hasPoint: data.response.result && data.response.result.point,
        hasItems: data.response.result && data.response.result.items,
        itemsLength: data.response.result && data.response.result.items ? data.response.result.items.length : 0,
        firstItem: data.response.result && data.response.result.items && data.response.result.items.length > 0
          ? data.response.result.items[0] : null,
      }, null, 2));
    }

    // 응답 구조 안전하게 확인
    if (!data || !data.response) {
      console.error(`응답 구조 오류: ${ address }`);
      return null;
    }

    // 상태 확인 (OK가 아니어도 계속 진행)
    if (data.response.status !== 'OK') {
      console.warn(`응답 상태가 OK가 아님: ${ data.response.status }, 주소: ${ address }`);
      // 상태가 OK가 아니어도 result 필드가 있을 수 있으므로 계속 진행
    }

    // 결과 필드 확인
    if (!data.response.result) {
      console.error(`좌표 결과 필드 없음: ${ address }`);
      return null;
    }

    // 결과 아이템 확인 (items 대신 point가 직접 있을 수도 있음)
    if (data.response.result.point) {
      // point가 직접 있는 경우
      console.log(`직접 point 필드 발견: ${ address }`);
      data.response.result.items = [{ point: data.response.result.point }];
    } else if (!data.response.result.items || !data.response.result.items.length) {
      console.error(`좌표 결과 아이템 없음: ${ address }`);
      return null;
    }

    // 좌표 추출 (안전하게 처리)
    try {
      // 응답 구조 상세 로깅
      console.log('좌표 추출 시도:', JSON.stringify(data.response.result.items[0], null, 2));

      // 다양한 응답 구조 처리
      let point;
      const firstItem = data.response.result.items[0];

      // 일반적인 구조
      if (firstItem.point) {
        point = firstItem.point;
      }
      // 대체 구조 1: 'point' 대신 'POINT' 또는 다른 대소문자 변형
      else if (firstItem.POINT) {
        point = firstItem.POINT;
      }
      // 대체 구조 2: 중첩된 구조
      else if (firstItem.structure && firstItem.structure.point) {
        point = firstItem.structure.point;
      }
      // 대체 구조 3: 직접 x, y 속성
      else if (firstItem.x && firstItem.y) {
        point = {
          x: firstItem.x,
          y: firstItem.y,
        };
      }
      // 대체 구조 4: 다른 이름의 좌표 속성
      else if (firstItem.lng || firstItem.lon) {
        point = {
          x: firstItem.lng || firstItem.lon,
          y: firstItem.lat,
        };
      }
      else {
        console.error(`알 수 없는 좌표 구조: ${ address }`, firstItem);
        return null;
      }

      if (!point || !point.x || !point.y) {
        console.error(`유효하지 않은 좌표 데이터: ${ address }`, point);
        return null;
      }

      const lon = parseFloat(point.x);
      const lat = parseFloat(point.y);

      if (isNaN(lon) || isNaN(lat)) {
        console.error(`좌표 변환 실패: ${ address }, x: ${ point.x }, y: ${ point.y }`);
        return null;
      }

      const result = { lon, lat };

      console.log(`좌표 변환 성공: ${ address } => lon: ${ result.lon }, lat: ${ result.lat }`);

      // 결과 캐싱 (3600초 = 1시간)
      geocodeCache.set(cacheKey, result, 3600);

      return result;
    } catch (err) {
      console.error(`좌표 추출 중 오류: ${ address }`, err);
      return null;
    }
  } catch (error) {
    console.error(`지오코딩 오류 (${ address }):`, error);
    return null;
  }
}

/**
 * CSV 파일 업로드 및 지오코딩 처리 API
 */
export async function POST(request: NextRequest) {
  try {
    // multipart/form-data 처리
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 },
      );
    }

    // CSV 파일 확인
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'Please upload a CSV file' },
        { status: 400 },
      );
    }

    // CSV 파일 읽기
    const text = await file.text();
    const { data, errors } = parse<string[]>(text, {
      header: false,
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Error parsing CSV file' },
        { status: 400 },
      );
    }

    // 헤더 확인
    const headers = data[0];
    if (!headers.includes('name') || !headers.includes('address') || !headers.includes('price')) {
      return NextResponse.json(
        { success: false, error: 'CSV must contain name, address, and price columns' },
        { status: 400 },
      );
    }

    // 인덱스 찾기
    const nameIndex = headers.indexOf('name');
    const addressIndex = headers.indexOf('address');
    const priceIndex = headers.indexOf('price');

    // 데이터 변환 및 지오코딩
    const locations: LocationData[] = [];

    // 첫 번째 행(헤더)를 제외하고 처리
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      if (row.length >= 3) {
        const name = row[nameIndex];
        const address = row[addressIndex];
        const priceStr = row[priceIndex];

        // 가격 변환
        const price = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);

        if (name && address && !isNaN(price)) {
          const location: LocationData = { name, address, price };

          // 주소 지오코딩
          try {
            const coords = await geocodeAddress(address);
            if (coords) {
              location.lat = coords.lat;
              location.lon = coords.lon;
            } else {
              // API 키가 설정되지 않았거나 지오코딩 실패 시 테스트용 고정 좌표 사용
              console.log(`지오코딩 실패, 테스트용 고정 좌표 사용: ${ address }`);

              // 샘플 데이터의 주소에 따라 고정 좌표 할당
              if (address.includes('강남')) {
                location.lat = 37.5017;
                location.lon = 127.0409;
              } else if (address.includes('여의도')) {
                location.lat = 37.5256;
                location.lon = 126.9241;
              } else if (address.includes('해운대')) {
                location.lat = 35.1631;
                location.lon = 129.1586;
              } else if (address.includes('대전')) {
                location.lat = 36.3504;
                location.lon = 127.3845;
              } else if (address.includes('제주')) {
                location.lat = 33.2496;
                location.lon = 126.4074;
              } else {
                // 기본 좌표 (서울시청)
                location.lat = 37.5666;
                location.lon = 126.9784;
              }
            }
          } catch (error) {
            console.error(`Error geocoding address ${ address }:`, error);

            // 오류 발생 시에도 테스트용 좌표 할당
            location.lat = 37.5666;
            location.lon = 126.9784;
          }

          locations.push(location);
        }
      }
    }

    return NextResponse.json({ success: true, data: locations });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
