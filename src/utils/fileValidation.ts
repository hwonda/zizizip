import { LocationData } from '@/types';
import type { WorkerMessage, WorkerResponse } from '@/workers/fileParser.worker';

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

    // 필수 필드 확인 (이름과 주소)
    if (item.name && item.name.trim().length > 0 && item.address && item.address.trim().length > 0) {
      isValidItem = true;
      hasAddress++;
    }

    // 좌표 정보 확인
    if (item.lat && item.lon && !isNaN(Number(item.lat)) && !isNaN(Number(item.lon))) {
      hasCoordinates++;
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
      error: '유효한 데이터(이름과 주소가 있는 행)가 없습니다.',
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
  const isCSV = fileName.endsWith('.csv');
  const isXLSX = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

  if (!isCSV && !isXLSX) {
    return 'CSV 또는 Excel 파일(.xlsx, .xls)만 업로드 가능합니다.';
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

// Worker 인스턴스 캐싱
let workerInstance: Worker | null = null;

/**
 * Worker 인스턴스를 가져옵니다 (싱글톤 패턴)
 */
const getWorker = (): Worker => {
  if (!workerInstance) {
    workerInstance = new Worker(
      new URL('@/workers/fileParser.worker.ts', import.meta.url),
    );
  }
  return workerInstance;
};

/**
 * Worker를 정리합니다 (페이지 언로드 시 호출)
 */
export const cleanupWorker = (): void => {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
};

/**
 * CSV 또는 Excel 파일 내용을 Web Worker에서 비동기로 검증합니다.
 * 메인 스레드를 블로킹하지 않습니다.
 */
export const validateCSVContent = async (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    try {
      const worker = getWorker();

      // 타임아웃 설정 (30초)
      const timeoutId = setTimeout(() => {
        resolve('파일 처리 시간이 초과되었습니다.');
      }, 30000);

      // Worker 응답 핸들러
      const handleMessage = (event: MessageEvent<WorkerResponse>) => {
        clearTimeout(timeoutId);
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);

        const { type, payload } = event.data;

        if (type === 'PARSE_ERROR') {
          resolve(payload.error || '파일 처리 중 오류가 발생했습니다.');
        } else {
          resolve(null); // 성공
        }
      };

      // Worker 에러 핸들러
      const handleError = () => {
        clearTimeout(timeoutId);
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        resolve('파일 처리 중 오류가 발생했습니다.');
      };

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);

      // 파일을 ArrayBuffer로 변환하여 Worker에 전송
      file.arrayBuffer().then((arrayBuffer) => {
        const message: WorkerMessage = {
          type: 'PARSE_FILE',
          payload: {
            arrayBuffer,
            fileName: file.name,
          },
        };
        worker.postMessage(message, [arrayBuffer]); // Transferable로 전송
      }).catch(() => {
        clearTimeout(timeoutId);
        resolve('파일을 읽을 수 없습니다.');
      });
    } catch {
      resolve('파일을 읽을 수 없습니다.');
    }
  });
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
