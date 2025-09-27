import { LocationData } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  error: string;
  validCount: number;
  warnings: string[];
}

/**
 * 업로드된 CSV 데이터의 유효성을 검증합니다.
 */
export const validateUploadResult = (data: LocationData[]): ValidationResult => {
  const warnings: string[] = [];
  let validCount = 0;
  let hasCoordinates = 0;
  let hasAddress = 0;

  // 데이터 항목별 검증
  data.forEach((item) => {
    let isValidItem = false;

    // 좌표 정보 확인
    if (item.lat && item.lon && !isNaN(Number(item.lat)) && !isNaN(Number(item.lon))) {
      hasCoordinates++;
      isValidItem = true;
    }

    // 주소 정보 확인
    if (item.address && item.address.trim().length > 0) {
      hasAddress++;
      isValidItem = true;
    }

    if (isValidItem) validCount++;
  });

  // 검증 실패 조건들
  if (data.length === 0) {
    return { isValid: false, error: '데이터가 없습니다.', validCount: 0, warnings: [] };
  }

  if (validCount === 0) {
    return {
      isValid: false,
      error: '유효한 위치 데이터(주소 또는 좌표)가 없습니다.',
      validCount: 0,
      warnings: [],
    };
  }

  // 경고 조건들
  const validPercentage = (validCount / data.length) * 100;

  if (validPercentage < 50) {
    return {
      isValid: false,
      error: `유효한 데이터가 너무 적습니다 (${ validCount }/${ data.length }, ${ validPercentage.toFixed(1) }%)`,
      validCount,
      warnings: [],
    };
  }

  if (validPercentage < 80) {
    warnings.push(`일부 데이터가 무효합니다 (${ validCount }/${ data.length })`);
  }

  if (hasCoordinates === 0 && hasAddress > 0) {
    warnings.push('좌표 정보가 없어 지오코딩이 필요합니다');
  }

  if (hasCoordinates < data.length * 0.5) {
    warnings.push('좌표가 없는 데이터가 많습니다');
  }

  return {
    isValid: true,
    error: '',
    validCount,
    warnings,
  };
};

/**
 * 파일 크기를 검증합니다.
 */
export const validateFileSize = (file: File, maxSizeMB: number = 10): string | null => {
  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    return `파일 크기는 ${ maxSizeMB }MB 이하여야 합니다.`;
  }
  return null;
};

/**
 * 파일 형식을 검증합니다.
 */
export const validateFileFormat = (fileName: string): string | null => {
  if (!fileName.endsWith('.csv')) {
    return 'CSV 파일만 업로드 가능합니다.';
  }
  return null;
};

/**
 * 파일명의 유효성을 검증합니다.
 */
export const validateFileName = (fileName: string): string | null => {
  const fileNameWithoutExt = fileName.replace('.csv', '').trim();

  if (fileNameWithoutExt.length === 0) {
    return '파일명이 유효하지 않습니다.';
  }

  // 특수문자 제한 체크
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(fileNameWithoutExt)) {
    return '파일명에 특수문자가 포함되어 있습니다.';
  }

  return null;
};

/**
 * 중복 파일명을 검증합니다.
 */
export const validateDuplicateFile = (
  fileName: string,
  existingDatasets: Array<{ name: string }>,
): string | null => {
  const fileNameWithoutExt = fileName.replace('.csv', '');
  const isDuplicate = existingDatasets.some((dataset) => dataset.name === fileNameWithoutExt);

  if (isDuplicate) {
    return '같은 이름의 파일이 이미 업로드되어 있습니다.';
  }

  return null;
};

/**
 * CSV 파일 내용을 미리 검증합니다.
 */
export const validateCSVContent = async (file: File): Promise<string | null> => {
  try {
    const text = await file.text();
    const lines = text.split('\n').filter((line) => line.trim());

    if (lines.length === 0) {
      return '파일이 비어있습니다.';
    }

    if (lines.length === 1) {
      return '헤더만 있고 데이터가 없습니다.';
    }

    // CSV 헤더 검증 (기본적인 컬럼이 있는지 확인)
    const header = lines[0].toLowerCase();
    const hasLocationData = header.includes('주소') || header.includes('address')
                           || header.includes('lat') || header.includes('lng')
                           || header.includes('lon') || header.includes('위도') || header.includes('경도');

    if (!hasLocationData) {
      return '위치 정보 컬럼(주소, 위도, 경도 등)이 필요합니다.';
    }

    return null;
  } catch {
    return '파일을 읽을 수 없습니다.';
  }
};

/**
 * 업로드 제한을 검증합니다.
 */
export const validateUploadLimit = (currentCount: number, maxCount: number = 3): string | null => {
  if (currentCount >= maxCount) {
    return `최대 ${ maxCount }개의 파일까지만 업로드할 수 있습니다.`;
  }
  return null;
};
