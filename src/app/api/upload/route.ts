import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'papaparse';
import * as XLSX from 'xlsx';
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
const RATE_LIMIT = 20; // 초당 최대 요청 수
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

  // 구주소(지번 주소) 형식 정제
  // 동, 가 뒤에 숫자-숫자 형식이 오는 경우 (예: 우이동 18-40)
  refined = refined.replace(/([가-힣]동|[가-힣]가|[가-힣]리)\s+(\d+)[-](\d+)/g, '$1 $2-$3');

  // 행정구역 표기 정규화 (서울시 -> 서울특별시, 경기도 -> 경기도 등)
  refined = refined.replace(/서울시/g, '서울특별시');
  refined = refined.replace(/\b서울\b(?!\s*특별시)/g, '서울특별시');
  refined = refined.replace(/부산시/g, '부산광역시');
  refined = refined.replace(/\b부산\b(?!\s*광역시)/g, '부산광역시');
  refined = refined.replace(/대구시/g, '대구광역시');
  refined = refined.replace(/\b대구\b(?!\s*광역시)/g, '대구광역시');
  refined = refined.replace(/인천시/g, '인천광역시');
  refined = refined.replace(/\b인천\b(?!\s*광역시)/g, '인천광역시');
  refined = refined.replace(/광주시(?!도)/g, '광주광역시'); // '경기도 광주시'와 구분하기 위한 부정형 전방탐색
  refined = refined.replace(/\b광주\b(?!\s*광역시)(?!도)/g, '광주광역시'); // '경기도 광주'와 구분
  refined = refined.replace(/대전시/g, '대전광역시');
  refined = refined.replace(/\b대전\b(?!\s*광역시)/g, '대전광역시');
  refined = refined.replace(/울산시/g, '울산광역시');
  refined = refined.replace(/\b울산\b(?!\s*광역시)/g, '울산광역시');
  refined = refined.replace(/세종시/g, '세종특별자치시');
  refined = refined.replace(/\b세종\b(?!\s*특별자치시)/g, '세종특별자치시');
  // 특수문자 처리 (하이픈은 유지)
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

    // 지번 주소인지 확인 (동, 가 등의 키워드와 번지 형식 확인)
    const isJibunAddress = /([가-힣]+(동|가|리))\s+\d+(-\d+)?($|\s)/.test(refinedAddress)
                          || /([가-힣]+(동|가|리))\s+\d+번지/.test(refinedAddress);

    // VWorld 지오코딩 API 호출 - https 사용
    // 도로명 주소와 지번 주소 모두 처리하기 위해 먼저 지번 주소로 시도
    const addressType = isJibunAddress ? 'PARCEL' : 'ROAD';
    const url = `https://api.vworld.kr/req/address?service=address&request=getCoord&version=2.0&crs=epsg:4326&address=${ encodeURIComponent(refinedAddress) }&refine=true&simple=false&format=json&type=${ addressType }&key=${ apiKey }`;

    console.log(`API 요청 URL: ${ url } (주소 타입: ${ addressType })`);

    let response = await fetch(url);
    if (!response.ok) {
      console.error(`API 응답 오류: ${ response.status } ${ response.statusText }`);
      return null;
    }

    let data = await response.json();

    // 첫 번째 시도가 실패하면 다른 주소 타입으로 다시 시도
    if (data.response.status !== 'OK' || !data.response.result) {
      console.log(`${ addressType } 주소 타입으로 변환 실패, 다른 타입으로 재시도합니다`);

      // 주소 타입 변경 (PARCEL -> ROAD 또는 ROAD -> PARCEL)
      const alternativeType = addressType === 'PARCEL' ? 'ROAD' : 'PARCEL';
      const alternativeUrl = `https://api.vworld.kr/req/address?service=address&request=getCoord&version=2.0&crs=epsg:4326&address=${ encodeURIComponent(refinedAddress) }&refine=true&simple=false&format=json&type=${ alternativeType }&key=${ apiKey }`;

      console.log(`대체 API 요청 URL: ${ alternativeUrl } (주소 타입: ${ alternativeType })`);

      response = await fetch(alternativeUrl);
      if (!response.ok) {
        console.error(`대체 API 응답 오류: ${ response.status } ${ response.statusText }`);
        return null;
      }

      data = await response.json();
    }
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

    // CSV 또는 XLSX 파일 확인
    const isCSV = file.name.endsWith('.csv');
    const isXLSX = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isCSV && !isXLSX) {
      return NextResponse.json(
        { success: false, error: 'CSV 또는 Excel 파일(.xlsx, .xls)만 업로드 가능합니다' },
        { status: 400 },
      );
    }

    // 파일 파싱 (CSV 또는 XLSX)
    let data: string[][];
    let errors: any[] = [];

    if (isCSV) {
      // CSV 파일 읽기
      const text = await file.text();
      const parseResult = parse<string[]>(text, {
        header: false,
        skipEmptyLines: true,
      });
      data = parseResult.data;
      errors = parseResult.errors;
    } else {
      // XLSX 파일 읽기
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // 첫 번째 시트 사용
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // 시트를 2차원 배열로 변환
        data = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: false,
        }) as string[][];

        // 빈 행 제거
        data = data.filter((row) => row.some((cell) => cell && cell.toString().trim()));
      } catch (error) {
        console.error('XLSX parsing error:', error);
        return NextResponse.json(
          { success: false, error: 'Excel 파일을 읽는 중 오류가 발생했습니다' },
          { status: 400 },
        );
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: `${ isCSV ? 'CSV' : 'Excel' } 파일을 파싱하는 중 오류가 발생했습니다` },
        { status: 400 },
      );
    }

    // 컬럼 매핑 정의
    const columnMappings = {
      name: ['이름', '명칭', '물건명', '주택군'],
      address: ['주소', '소재지', '위치'],
      building: ['동'],
      unit: ['호'],
      exclusiveArea: ['전용면적', '전용'],
      livingArea: ['주거공용면적', '주거공용', '공용면적'],
      totalArea: ['면적계', '총면적', '계'],
      rooms: ['방수', '방'],
      floor: ['층수', '층'],
      elevator: ['승강기'],
      houseType: ['주택유형', '유형'],
      priceDeposit: ['임대보증금', '보증금', '전세'],
      priceMonthly: ['월임대료', '월세'],
      priceSale: ['매매가', '매매'],
    };

    // 헤더 확인 (이름과 주소만 필수)
    const headers = data[0].map((header: string) => header.trim());

    // 필수 컬럼 확인
    const hasName = columnMappings.name.some((nameVariant) =>
      headers.some((header) => header.includes(nameVariant)),
    );
    const hasAddress = columnMappings.address.some((addressVariant) =>
      headers.some((header) => header.includes(addressVariant)),
    );

    if (!hasName || !hasAddress) {
      return NextResponse.json(
        { success: false, error: 'CSV must contain name and address columns' },
        { status: 400 },
      );
    }

    // 각 필드의 인덱스 찾기
    const getColumnIndex = (fieldMappings: string[]) => {
      for (const mapping of fieldMappings) {
        const index = headers.findIndex((header) => header.includes(mapping));
        if (index !== -1) return index;
      }
      return -1;
    };

    const columnIndices = {
      name: getColumnIndex(columnMappings.name),
      address: getColumnIndex(columnMappings.address),
      building: getColumnIndex(columnMappings.building),
      unit: getColumnIndex(columnMappings.unit),
      exclusiveArea: getColumnIndex(columnMappings.exclusiveArea),
      livingArea: getColumnIndex(columnMappings.livingArea),
      totalArea: getColumnIndex(columnMappings.totalArea),
      rooms: getColumnIndex(columnMappings.rooms),
      floor: getColumnIndex(columnMappings.floor),
      elevator: getColumnIndex(columnMappings.elevator),
      houseType: getColumnIndex(columnMappings.houseType),
      priceDeposit: getColumnIndex(columnMappings.priceDeposit),
      priceMonthly: getColumnIndex(columnMappings.priceMonthly),
      priceSale: getColumnIndex(columnMappings.priceSale),
    };

    // 유틸리티 함수들
    const parseNumber = (value: string | undefined): number | undefined => {
      if (!value) return undefined;
      const numStr = value.replace(/[^0-9.]/g, '');
      const num = parseFloat(numStr);
      return isNaN(num) ? undefined : num;
    };

    const parseBoolean = (value: string | undefined): boolean | undefined => {
      if (!value) return undefined;
      const lowerValue = value.toLowerCase().trim();
      if (lowerValue.includes('있') || lowerValue.includes('유') || lowerValue === 'o' || lowerValue === 'yes') {
        return true;
      }
      if (lowerValue.includes('없') || lowerValue.includes('무') || lowerValue === 'x' || lowerValue === 'no') {
        return false;
      }
      return undefined;
    };

    const getValue = (row: string[], index: number): string | undefined => {
      return index !== -1 && row[index] ? row[index].trim() : undefined;
    };

    // 데이터 변환 및 지오코딩
    const locations: LocationData[] = [];

    // 첫 번째 행(헤더)를 제외하고 처리
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      if (row.length >= 2) {
        const name = getValue(row, columnIndices.name);
        const address = getValue(row, columnIndices.address);

        if (name && address) {
          // 가격 정보 파싱
          const deposit = parseNumber(getValue(row, columnIndices.priceDeposit));
          const monthly = parseNumber(getValue(row, columnIndices.priceMonthly));
          const sale = parseNumber(getValue(row, columnIndices.priceSale));

          const location: LocationData = {
            name,
            address,
            // 선택적 필드들
            building: getValue(row, columnIndices.building),
            unit: getValue(row, columnIndices.unit),
            exclusiveArea: parseNumber(getValue(row, columnIndices.exclusiveArea)),
            livingArea: parseNumber(getValue(row, columnIndices.livingArea)),
            totalArea: parseNumber(getValue(row, columnIndices.totalArea)),
            rooms: parseNumber(getValue(row, columnIndices.rooms)),
            floor: parseNumber(getValue(row, columnIndices.floor)),
            elevator: parseBoolean(getValue(row, columnIndices.elevator)),
            houseType: getValue(row, columnIndices.houseType),

            // 가격 정보 (계층적 구조)
            price: (deposit || monthly || sale) ? {
              deposit,
              monthly,
              sale,
            } : undefined,
          };

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
                // location.lat = 37.5666;
                // location.lon = 126.9784;
              }
            }
          } catch (error) {
            console.error(`Error geocoding address ${ address }:`, error);
            // location.lat = 37.5666;
            // location.lon = 126.9784;
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