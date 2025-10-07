/**
 * CSV/Excel 파일의 헤더 row를 찾아주는 유틸리티
 */

/**
 * 주어진 데이터에서 유효한 헤더 row 인덱스를 찾습니다.
 * 'name'과 'address' 컬럼이 모두 존재하는 첫 번째 row를 반환합니다.
 *
 * @param rows - 파싱된 전체 row 데이터
 * @returns 헤더 row 인덱스 (0-based), 찾지 못하면 -1
 */
export function findHeaderRowIndex(rows: string[][]): number {
  // name 컬럼 매핑 값들
  const nameColumns = ['이름', '명칭', '물건명', '주택군', '주택군 이름'];
  // address 컬럼 매핑 값들
  const addressColumns = ['주소', '소재지', '위치'];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // 현재 row에 name과 address 컬럼이 모두 있는지 확인
    const hasNameColumn = row.some((cell) => {
      const trimmed = cell?.toString().trim();
      return trimmed && nameColumns.some((nameCol) => trimmed.includes(nameCol));
    });
    const hasAddressColumn = row.some((cell) => {
      const trimmed = cell?.toString().trim();
      return trimmed && addressColumns.some((addrCol) => trimmed.includes(addrCol));
    });

    console.log(`Row ${ i }: hasName=${ hasNameColumn }, hasAddress=${ hasAddressColumn }`, row.slice(0, 10));

    if (hasNameColumn && hasAddressColumn) {
      return i;
    }
  }

  return -1; // 헤더를 찾지 못함
}

/**
 * 헤더 row 이후의 데이터만 반환합니다.
 *
 * @param rows - 파싱된 전체 row 데이터
 * @returns { headerIndex: number, dataRows: string[][] } 헤더 인덱스와 데이터 rows
 * @throws Error 헤더를 찾지 못한 경우
 */
export function extractDataFromHeaderRow(rows: string[][]): {
  headerIndex: number;
  headerRow: string[];
  dataRows: string[][]
} {
  const headerIndex = findHeaderRowIndex(rows);

  if (headerIndex === -1) {
    throw new Error('유효한 헤더를 찾을 수 없습니다. \'이름\'과 \'주소\' 컬럼이 포함된 행이 필요합니다.');
  }

  return {
    headerIndex,
    headerRow: rows[headerIndex],
    dataRows: rows.slice(headerIndex + 1), // 헤더 이후의 데이터만
  };
}
