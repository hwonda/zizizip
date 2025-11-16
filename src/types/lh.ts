export interface LHNotice {
  AIS_TP_CD: string; // 공고유형코드
  AIS_TP_CD_NM: string; // 공고유형코드명
  PAN_ID: string; // 공고ID
  PAN_NM: string; // 공고명
  PAN_NT_ST_DT: string; // 공고시작일
  CLSG_DT: string; // 마감일
  PAN_SS: string; // 공고내용
  UPD_DT: string; // 수정일
  GDNC_URL: string; // 안내URL
}

export interface LHResponse {
  body: LHNotice[];
  header: {
    code: string;
    message: string;
  };
}

export interface LHApiResponse {
  response?: LHResponse;
  error?: string;
}
