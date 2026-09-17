# LH 첨부파일 자동 확보 PoC — 결과 보고서

검증일: 2026-09-17

## 결론: 성공

LH 공급주택목록 Excel 파일의 자동 확보가 **쿠키/세션/로그인 없이 가능**하다.
Python 표준 라이브러리(urllib)만으로 재현 가능하며, 외부 패키지 의존 없음.

---

## 1. LH API에서 서울+매입임대 공고 식별

### 확인한 사실

- **API 엔드포인트**: `http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1`
- **날짜 형식**: `YYYY.MM.DD` (기존 코드와 동일, 정상 작동 확인)
- **파라미터 키**: `ServiceKey` (대문자 S, 기존 코드와 동일)
- **응답 구조**: `[메타데이터, {dsList: [...], resHeader: [...]}]` 배열
- **페이지네이션**: `PAGE` + `PG_SZ` 파라미터. 100건씩 요청 시 마지막 페이지는 < 100건
- **매입임대 분류**: `UPP_AIS_TP_NM: "주거복지"`, `AIS_TP_CD_NM: "매입임대"`
- **서울 식별**: `CNP_CD_NM: "서울특별시"` 또는 공고명에 `서울` 포함

### 검증 결과

최근 90일 공고 617건 중:
- 매입임대: 81건
- **서울+매입임대: 4건** (청년 1, 신혼·신생아Ⅰ 1, 신혼·신생아Ⅱ 1, 공동생활가정 1)

공동생활가정은 운영기관 모집이라 공급주택목록이 없는 것이 정상.

### 기존 코드와의 차이

기존 `src/app/api/lh/route.ts`에서 발견한 문제:
- `PG_SZ=10`, `PAGE=1` 고정 → 최대 10건만 조회. 페이지네이션 필요
- `PAN_NT_ST_DT`와 `CLSG_DT` 모두 오늘로 설정 → 당일 게시+당일 마감만 조회. 범위 확대 필요

---

## 2. 상세 페이지에서 첨부파일 경로

### 확인한 사실

- **상세 URL 패턴**: `https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancInfo.do?panId={PAN_ID}&ccrCnntSysDsCd=03&uppAisTpCd=13&aisTpCd=26&mi=1026`
- **상세 페이지**: 서버 렌더링 HTML (SPA 아님). urllib로 직접 접근 가능
- **첨부파일 다운로드 방식**: JavaScript 함수 `fileDownLoad('fileId')` → `location.href = "/lhapply/lhFile.do?fileid=" + fileId`
- **fileId**: HTML 내에 하드코딩된 숫자 문자열 (예: `68596948`)
- **파일명 위치**: `<a href="javascript:fileDownLoad('ID');">파일명.xlsx</a>` 형태로 인접

### 추출 전략

```
1차: regex로 fileDownLoad('ID');">파일명.xlsx 패턴에서 '공급주택' 포함 항목 추출
2차: '공급주택목록' 텍스트 주변 500자에서 fileId 역추적
```

### 공고별 첨부 구성 예시

| 공고 | 첨부파일 |
|------|---------|
| 청년 매입임대 | 모집공고문.hwpx, 모집공고문.pdf, 유의사항.hwpx, QnA.hwpx, **공급주택목록.xlsx** |
| 신혼·신생아Ⅰ | 모집공고문.hwpx, 모집공고문.pdf, **공급주택목록.xlsx** |
| 신혼·신생아Ⅱ | 모집공고문.hwpx, 모집공고문.pdf, **공급주택목록.xlsx** |
| 공동생활가정 | 모집공고문.hwpx, 모집공고문.pdf, 신청서.hwpx, 신청서.pdf (주택목록 없음) |

---

## 3. 다운로드 검증

### 확인한 사실

- **다운로드 URL**: `https://apply.lh.or.kr/lhapply/lhFile.do?fileid={fileId}`
- **인증 불필요**: 쿠키, 세션, 로그인 토큰 없이 GET 요청만으로 다운로드 성공
- **응답 헤더**: `Content-Type: application/octet-stream`, `Content-Disposition: attachment;filename="..."`
- **파일 검증**: ZIP/XLSX 시그니처 (`PK\x03\x04`) 일치 확인

### 다운로드 결과

| 공고 | fileId | 파일 크기 | XLSX 검증 |
|------|--------|----------|----------|
| 청년 매입임대 | 68596948 | 93,997 bytes | OK |
| 신혼·신생아Ⅰ | 68646052 | 29,445 bytes | OK |
| 신혼·신생아Ⅱ | 68646211 | 24,973 bytes | OK |

---

## 4. 재현 가능성

- **/tmp 빈 디렉토리**에서 스크립트 단독 실행: 3건 모두 성공
- **외부 패키지 의존 없음**: Python 3.12 stdlib만 사용 (urllib, json, re)
- **환경변수 1개**: `NEXT_PUBLIC_LH_API_KEY` (또는 프로젝트 루트의 `.env.local`에서 자동 로드)

---

## 5. 실행 방법

```bash
# 환경변수 설정
export NEXT_PUBLIC_LH_API_KEY=your_key_here

# 실행
python3 poc/lh_attachment_poc.py

# 결과
# poc/downloads/ 에 xlsx 파일과 poc_result.json 생성
```

---

## 6. 남은 제약과 리스크

### 확인된 제약

1. **fileId가 HTML에 하드코딩** — 별도 API로 첨부 목록을 조회하는 방법은 확인되지 않음. HTML 파싱이 유일한 경로.
2. **HTML 구조 의존** — `fileDownLoad('ID')` 패턴이 변경되면 추출 실패. LH 사이트 리뉴얼 시 대응 필요.
3. **공급주택목록이 없는 공고 존재** — 공동생활가정 등 일부 공고 유형은 주택목록 대신 다른 첨부를 사용.
4. **파일명 인코딩** — `Content-Disposition` 헤더의 파일명이 깨짐 (EUC-KR/UTF-8 혼재 추정). 파일명은 HTML에서 추출한 것을 사용해야 안정적.

### 미검증 사항

1. **청년/고령자 공고의 Excel 구조** — 신혼·신생아와 컬럼 배치가 다를 수 있음
2. **과거 공고의 첨부 접근** — 마감된 공고의 fileId가 계속 유효한지 장기 확인 필요
3. **다운로드 Rate Limit** — 대량 다운로드 시 차단 여부 (현재 3건은 문제 없음)
4. **다른 지역본부** — 서울 외 지역의 HTML 구조가 동일한지 (같은 사이트이므로 동일할 가능성 높음)
5. **셀 병합 헤더 파싱** — 다운로드한 xlsx의 실제 헤더 구조 (3단 병합 등)는 파서 구현 시 검증 필요

### 결론

LH 공급주택목록 자동 확보 파이프라인 구축이 **기술적으로 가능**하다.
핵심 경로: `LH API(공고 목록)` → `상세 HTML(fileId 추출)` → `lhFile.do(직접 다운로드)`.
인증 장벽 없음, CAPTCHA 없음, 표준 라이브러리만으로 동작.
