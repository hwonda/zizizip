export interface LHNotice {
  PAN_NT_ST_DT: string; // 공고시작일
  PAN_ID: string; // 공고ID
  AIS_TP_CD_NM: string; // 공고유형코드명
  CNP_CD_NM: string; // 지역명
  ALL_CNT: string; // 전체 건수
  SPL_INF_TP_CD: string; // 특별정보유형코드
  AIS_TP_CD: string; // 공고유형코드
  PAN_DT: string; // 공고일
  RNUM: string; // 순번
  CCR_CNNT_SYS_DS_CD: string; // 시스템구분코드
  DTL_URL: string; // 상세URL
  CLSG_DT: string; // 마감일
  UPP_AIS_TP_CD: string; // 상위공고유형코드
  PAN_NM: string; // 공고명
  UPP_AIS_TP_NM: string; // 상위공고유형명
  PAN_SS: string; // 공고상태
  DTL_URL_MOB: string; // 모바일상세URL
}

export interface LHApiResponse {
  dsSch?: Array<{
    PAN_ED_DT: string;
    PG_SZ: string;
    PAN_ST_DT: string;
    PAGE: string;
  }>;
  dsList?: LHNotice[];
  resHeader?: Array<{
    RS_DTTM: string;
    SS_CODE: string;
  }>;
}
