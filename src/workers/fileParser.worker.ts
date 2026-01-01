/**
 * 파일 파싱을 위한 Web Worker
 * 메인 스레드를 블로킹하지 않고 CSV/Excel 파일을 파싱합니다.
 */

import * as XLSX from 'xlsx';

// Worker 메시지 타입
export interface WorkerMessage {
  type: 'PARSE_FILE';
  payload: {
    arrayBuffer: ArrayBuffer;
    fileName: string;
  };
}

export interface WorkerResponse {
  type: 'PARSE_SUCCESS' | 'PARSE_ERROR';
  payload: {
    data?: string[][];
    error?: string;
    headerIndex?: number;
  };
}

/**
 * 헤더 row 인덱스를 찾습니다.
 */
function findHeaderRowIndex(rows: string[][]): number {
  const nameColumns = ['이름', '명칭', '물건명', '주택군', '주택군 이름'];
  const addressColumns = ['주소', '소재지', '위치'];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const hasNameColumn = row.some((cell) => {
      const trimmed = cell?.toString().trim();
      return trimmed && nameColumns.some((nameCol) => trimmed.includes(nameCol));
    });
    const hasAddressColumn = row.some((cell) => {
      const trimmed = cell?.toString().trim();
      return trimmed && addressColumns.some((addrCol) => trimmed.includes(addrCol));
    });

    if (hasNameColumn && hasAddressColumn) {
      return i;
    }
  }

  return -1;
}

/**
 * 파일 파싱 함수
 */
function parseFile(arrayBuffer: ArrayBuffer, fileName: string): WorkerResponse {
  try {
    const isCSV = fileName.endsWith('.csv');
    const isXLSX = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    let data: string[][] = [];

    if (isCSV) {
      // CSV 파일 처리
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(arrayBuffer);
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length === 0) {
        return {
          type: 'PARSE_ERROR',
          payload: { error: '파일이 비어있습니다.' },
        };
      }

      // CSV를 2차원 배열로 변환
      data = lines.map((line) => line.split(',').map((cell) => cell.trim()));
    } else if (isXLSX) {
      // Excel 파일 처리
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: false,
      }) as string[][];

      // 빈 행 제거
      data = data.filter((row) => row.some((cell) => cell && cell.toString().trim()));
    } else {
      return {
        type: 'PARSE_ERROR',
        payload: { error: '지원하지 않는 파일 형식입니다.' },
      };
    }

    if (data.length === 0) {
      return {
        type: 'PARSE_ERROR',
        payload: { error: '파일이 비어있습니다.' },
      };
    }

    // 헤더 row 찾기
    const headerIndex = findHeaderRowIndex(data);

    if (headerIndex === -1) {
      return {
        type: 'PARSE_ERROR',
        payload: { error: '유효한 헤더를 찾을 수 없습니다. \'이름\'과 \'주소\' 컬럼이 포함된 행이 필요합니다.' },
      };
    }

    // 헤더 이후 데이터가 있는지 확인
    if (headerIndex >= data.length - 1) {
      return {
        type: 'PARSE_ERROR',
        payload: { error: '헤더만 있고 데이터가 없습니다.' },
      };
    }

    return {
      type: 'PARSE_SUCCESS',
      payload: { data, headerIndex },
    };
  } catch {
    return {
      type: 'PARSE_ERROR',
      payload: { error: '파일을 읽을 수 없습니다.' },
    };
  }
}

// Worker 메시지 핸들러
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  if (type === 'PARSE_FILE') {
    const result = parseFile(payload.arrayBuffer, payload.fileName);
    self.postMessage(result);
  }
};

// TypeScript가 이 파일이 Worker임을 인식하도록 export
export {};

