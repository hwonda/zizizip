// LH API 지역코드
export const LH_REGION_CODES = [
  { code: '', label: '전체' },
  { code: '11', label: '서울' },
  { code: '26', label: '부산' },
  { code: '27', label: '대구' },
  { code: '28', label: '인천' },
  { code: '29', label: '광주' },
  { code: '30', label: '대전' },
  { code: '31', label: '울산' },
  { code: '36', label: '세종' },
  { code: '41', label: '경기' },
  { code: '42', label: '강원' },
  { code: '43', label: '충북' },
  { code: '44', label: '충남' },
  { code: '45', label: '전북' },
  { code: '46', label: '전남' },
  { code: '47', label: '경북' },
  { code: '48', label: '경남' },
  { code: '50', label: '제주' },
] as const;

// LH API 공고상태코드
export const LH_STATUS_CODES = [
  { code: '', label: '전체' },
  { code: '공고중', label: '공고중' },
  { code: '접수중', label: '접수중' },
  { code: '접수마감', label: '접수마감' },
  { code: '정정공고중', label: '정정공고중' },
] as const;

// LH API 공고유형코드
export const LH_TYPE_CODES = [
  { code: '', label: '전체' },
  { code: '01', label: '임대주택' },
  { code: '02', label: '분양주택' },
  { code: '03', label: '토지' },
  { code: '04', label: '상가' },
] as const;

export type LHRegionCode = (typeof LH_REGION_CODES)[number]['code'];
export type LHStatusCode = (typeof LH_STATUS_CODES)[number]['code'];
export type LHTypeCode = (typeof LH_TYPE_CODES)[number]['code'];

