# ZIZIZIP 2.0 코드베이스 분석 보고서

> 분석일: 2026-09-17 | 기준 커밋: `ab9e22d`

---

## 1. 업로드 → 파싱 → 지오코딩 → 지도 표시 흐름

### 전체 데이터 파이프라인

```
[파일 선택] → [클라이언트 검증(Worker)] → [서버 파싱+지오코딩] → [데이터셋 저장] → [이벤트 전파] → [마커 렌더링]
```

**Step 1: 클라이언트 사전 검증** (메인 스레드 비차단)
- `src/utils/fileValidation.ts:87-106` — 파일 크기(10MB), 형식(.csv/.xlsx/.xls) 검증
- `src/utils/fileValidation.ts:144-227` — Web Worker 싱글톤으로 파일 파싱 (30초 타임아웃)
- `src/workers/fileParser.worker.ts:56-134` — Worker 내부에서 xlsx 라이브러리로 파싱 후 헤더 유효성 검증
  - CSV: `TextDecoder('utf-8')` → 줄 단위 split (line 64-77)
  - Excel: `XLSX.read(arrayBuffer)` → `sheet_to_json` (line 80-91)
  - 헤더 판정: `이름/명칭/물건명` + `주소/소재지/위치` 컬럼이 **둘 다** 존재하는 첫 번째 행 (line 29-51)

**Step 2: 서버 파싱 + 지오코딩** (`src/app/api/upload/route.ts`)
- `POST` 핸들러가 `multipart/form-data`에서 파일 수신 (line 273-278)
- **서버에서도 동일한 파싱 반복**: papaparse(CSV) / xlsx(Excel) 사용 (line 301-336)
- 헤더 탐색은 `extractDataFromHeaderRow()` 재사용 (line 349-358)
- **컬럼 매핑** (line 361-376):

| 필드 | 매핑 키워드 |
|------|-----------|
| name | 이름, 명칭, 물건명, 주택군 |
| address | 주소, 소재지, 위치 |
| building/unit | 동, 호 |
| exclusiveArea | 전용면적, 전용 |
| rooms/floor | 방수/방, 층수/층 |
| elevator | 승강기 |
| houseType | 주택유형, 유형 |
| price* | 임대보증금/보증금/전세, 월임대료/월세, 매매가/매매 |

- **다중 가격 세트 감지** (line 379-398): 보증금/월세 컬럼이 2개 이상이면 `priceSets[]` 배열로 저장
- **지오코딩** (line 119-268):
  - 인메모리 캐시 (TTL 1시간, line 37-38)
  - 레이트 리밋 20 req/sec (line 40-62)
  - `refineAddress()`: 괄호 제거, 행정구역 정규화(서울시→서울특별시 등), 특수문자 제거 (line 67-114)
  - VWorld API: 지번(PARCEL)↔도로명(ROAD) 자동 폴백 (line 146-175)
  - **하드코딩된 폴백 좌표**: 지오코딩 실패 시 `강남`, `여의도` 등 키워드로 고정 좌표 할당 (line 603-618)

**Step 3: 데이터셋 관리 → 이벤트 전파**
- `src/hooks/useDatasetManager.ts` — sessionStorage 기반, 6색 순환 팔레트
- `addDataset()` (line 96-109) → `LocationData[]`를 `LocationDataset`으로 래핑
- `getSelectedData()` (line 159-170) → 선택된 데이터셋을 `ExtendedLocationData[]`로 평탄화 (datasetId/Name/Color 부착)
- `UploadSidebar` → `window.dispatchEvent(new CustomEvent('locationDataUpdated'))` 발생

**Step 4: 이벤트 수신 → 마커 렌더링**
- `src/components/map/MapContainer.tsx:46-58` — `locationDataUpdated` 이벤트 리스닝 → `onDataUploaded` 콜백
- `src/components/map/MapPageClient.tsx:51-53` — `handleDataUploaded` → `setLocations(data)` → `filteredLocations` useMemo
- `src/components/map/MarkerManager.tsx:57-135` — 데이터 변경 감지(prevLocationsRef) → `groupLocationsByCoordinates()` → OpenLayers Feature 생성
  - 좌표 변환: `fromLonLat([lon, lat])` (EPSG:4326 → EPSG:3857)
  - 첫 로딩 시 `map.getView().fit(extent)` (line 124-128)

### 확인한 사실
- 파싱이 **클라이언트(Worker) + 서버(API route)** 양쪽에서 중복 수행됨
- Worker는 검증 목적이고, 실제 데이터 변환은 서버에서 수행
- 지오코딩은 서버 사이드에서 순차(for loop) 실행 — 병렬화 없음
- `refineAddress()`는 한국 주소 특화 로직이 상당히 성숙함

### 미확인 사항
- 대용량 파일(수천 행) 업로드 시 지오코딩 순차 호출의 실제 소요 시간
- VWorld API의 일일 호출 한도 및 에러 코드별 처리 여부
- 하드코딩된 폴백 좌표(line 603-618)가 운영 환경에서도 활성화되는지 의도된 것인지

---

## 2. LH 공고 조회와 지도 연결의 실제 구현 범위

### 구현 완료된 부분

| 영역 | 파일 | 상태 |
|------|------|------|
| API 라우트 | `src/app/api/lh/route.ts` | **구현됨** — data.go.kr `lhLeaseNoticeInfo1` 호출 |
| React Query 훅 | `src/hooks/queries/useLHQuery.ts` | **구현됨** — staleTime 5분, retry 2 |
| Zustand 스토어 | `src/stores/usePublicHousingStore.ts` | **구현됨** — LH/SH/GH 3종 선택 상태 관리 |
| 사이드바 UI | `src/components/navigation/LHSidebar.tsx` | **구현됨** — 공고 목록 표시, 체크박스 선택 |
| 탭 컴포넌트 | `src/components/ui/Tabs.tsx` | **구현됨** |

### 미구현 / 비활성화된 부분

- **NavigationWrapper에서 탭 전체 주석 처리됨** (`src/components/navigation/NavigationWrapper.tsx:55-75`)
  - `LHSidebar` import 주석, Tabs import 주석, activeTab 상태 주석
  - 현재는 `UploadSidebar`만 렌더링
- **LH 공고 → 지도 마커 연결: 미구현**
  - LH API 응답(`LHNotice`)에는 좌표 정보 없음 — `PAN_NM`(공고명), `DTL_URL`(상세URL)만 존재
  - 선택된 공고의 첨부파일(Excel) 다운로드 → 파싱 → 지오코딩 파이프라인 **전무**
  - `usePublicHousingStore`의 선택 상태가 MapPageClient로 전달되는 경로 없음
- **SH/GH**: API 라우트 없음, 사이드바 없음, 타입 정의 없음 — 순수 스텁

### LH API 호출 세부 (`src/app/api/lh/route.ts`)
- 엔드포인트: `http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1`
- 파라미터: `PG_SZ=10`, `PAGE=1`, 오늘 날짜 기준 `PAN_NT_ST_DT`/`CLSG_DT`
- 응답 파싱: `Array.isArray(data) && data.length > 1` → `data[1]` 반환 (line 36-38)
- **페이지네이션 미구현** — 항상 첫 10건만 조회

### 확인한 사실
- LH 공고 목록 조회까지는 완성되어 있으나, **선택 → 지도 표시** 연결이 완전히 빠져 있음
- `LHNotice` 타입(`src/types/lh.ts`)에는 주소/좌표 필드 없음 — 공고 메타데이터만 존재
- LH 첨부파일에서 실제 매물 데이터를 추출하는 로직은 어디에도 없음

### 제안
- LH 공고의 첨부파일(Excel)을 다운로드+파싱하는 별도 API가 필요
- 공고 상세(`DTL_URL`)에서 첨부파일 URL을 스크래핑하거나, LH 상세 API가 있다면 활용
- 선택된 공고 ID → 상세 조회 → 첨부 파싱 → 기존 `LocationData` 타입으로 변환 → 기존 마커 파이프라인 합류

### 미확인 사항
- LH 상세 API(`lhLeaseNoticeInfo2` 등)에서 첨부파일 URL을 직접 제공하는지
- LH 첨부 Excel의 실제 컬럼 구조 (기존 `columnMappings`와 호환되는지)
- SH/GH API의 실제 엔드포인트와 응답 형식

---

## 3. 기존 파서의 재사용 가능 부분과 분리할 부분

### 재사용 가능 (순수 로직, 프레임워크 비의존)

| 모듈 | 파일 | 재사용성 | 비고 |
|------|------|---------|------|
| 헤더 탐색 | `src/utils/csvParser.ts` | **높음** | `findHeaderRowIndex()`, `extractDataFromHeaderRow()` — 순수 함수 |
| 마커 그룹핑 | `src/utils/marker/markerGrouping.ts` | **높음** | `groupLocationsByCoordinates()` — 순수 함수 |
| 마커 비교 | `src/utils/marker/markerComparison.ts` | **높음** | 순수 비교 함수 |
| 필터 로직 | `src/utils/filterLocations.ts` | **높음** | `filterLocations()`, `extractHouseTypes()` — 순수 함수 |
| 주소 정제 | `route.ts:67-114` | **높음** | `refineAddress()` — 추출하면 재사용 가능 |
| 컬럼 매핑 | `route.ts:361-376` | **높음** | 매핑 정의 자체는 설정 데이터 |
| 값 파싱 | `route.ts:433-464` | **높음** | `parseNumber()`, `parseBoolean()`, `getValue()` — 순수 함수 |
| 가격 세트 감지 | `route.ts:379-398` | **높음** | `findMultiplePriceColumns()` — 순수 함수 |
| 파일 검증 | `src/utils/fileValidation.ts:14-142` | **높음** | 검증 함수들은 프레임워크 무관 |
| 타입 정의 | `src/types/index.ts`, `src/types/lh.ts` | **높음** | TypeScript 타입은 그대로 공유 가능 |

### 분리/재설계 필요

| 모듈 | 파일 | 이유 |
|------|------|------|
| Upload API route | `src/app/api/upload/route.ts` | Next.js API route에 파싱+지오코딩+캐시+레이트리밋이 **단일 660줄 함수에 혼재**. 분리 필수 |
| 인메모리 캐시 | `route.ts:8-34` | 서버리스 환경에서 인스턴스 간 공유 불가. Redis 등으로 교체 필요 |
| 레이트 리밋 | `route.ts:40-62` | 전역 변수 기반 — 다중 인스턴스에서 무의미 |
| Web Worker 파싱 | `src/workers/fileParser.worker.ts` | 헤더 탐색 로직이 `csvParser.ts`와 **완전 중복** (line 29-51) |
| 하드코딩 폴백 좌표 | `route.ts:603-618` | 개발용 코드가 프로덕션에 포함. 제거 또는 설정으로 이동 |
| 데이터셋 관리 | `src/hooks/useDatasetManager.ts` | sessionStorage 기반 — 대용량/다중탭에 한계. 서버 상태 관리로 전환 고려 |

### 제안: 파서 레이어 분리 구조

```
shared/
├── types/           <- 기존 타입 그대로
├── parsers/
│   ├── headerDetector.ts    <- csvParser.ts에서 추출
│   ├── columnMapper.ts      <- columnMappings + getColumnIndex
│   ├── valueParser.ts       <- parseNumber, parseBoolean, getValue
│   ├── priceParser.ts       <- findMultiplePriceColumns + 가격 세트 조립
│   └── addressRefiner.ts    <- refineAddress
└── filters/
    └── locationFilter.ts    <- filterLocations 그대로
```

---

## 4. 실제 LH 첨부파일로 검증해야 할 가정 목록

현재 파서는 사용자가 직접 업로드하는 Excel을 대상으로 설계되어 있다.
LH 첨부파일 자동 파싱을 도입하려면 아래 가정들을 실제 파일로 검증해야 한다.

| # | 가정 | 검증 방법 | 영향받는 코드 |
|---|------|----------|-------------|
| 1 | LH 첨부 Excel에 `이름/명칭/물건명`과 `주소/소재지/위치` 컬럼이 존재한다 | 실제 파일 헤더 확인 | `csvParser.ts:14-16`, Worker `line 30-31` |
| 2 | 헤더 행이 첫 번째 행이 아닐 수 있다 (상단에 공고 정보 등이 있을 수 있음) | 실제 파일 구조 확인 | `findHeaderRowIndex()` — 이미 동적 탐색이므로 대응 가능할 수 있음 |
| 3 | 주소 컬럼의 값이 VWorld API로 지오코딩 가능한 형식이다 | 실제 주소 값으로 API 호출 테스트 | `refineAddress()`, `geocodeAddress()` |
| 4 | 가격 컬럼명이 기존 매핑(`임대보증금`, `월임대료` 등)과 일치한다 | 실제 파일 컬럼명 비교 | `columnMappings` (route.ts:361-376) |
| 5 | 단일 시트에 모든 매물 데이터가 있다 (현재는 `SheetNames[0]`만 사용) | 실제 파일 시트 구조 확인 | Worker `line 81`, route.ts `line 317` |
| 6 | LH Excel에 동/호/층수/전용면적 등의 컬럼이 존재한다 | 실제 파일 확인 | `columnMappings`의 building, unit, floor 등 |
| 7 | 셀 병합이 데이터 파싱을 방해하지 않는다 | xlsx 라이브러리의 병합 셀 처리 확인 | `XLSX.utils.sheet_to_json` 옵션 |
| 8 | 인코딩이 UTF-8이다 (CSV의 경우) | 실제 파일 인코딩 확인 | Worker `line 66`: `TextDecoder('utf-8')` 하드코딩 |
| 9 | LH 첨부파일의 다운로드 URL이 프로그래밍적으로 접근 가능하다 | `DTL_URL` 페이지 구조 분석 | 신규 개발 필요 |
| 10 | LH 공고별 첨부파일 형식이 표준화되어 있다 (공고마다 컬럼이 다르지 않다) | 여러 공고의 첨부파일 비교 | 파서의 유연성 수준 결정 |
| 11 | 다중 가격 세트(임대조건 1, 2, ...)가 LH 첨부에도 존재하는지 | 실제 파일 확인 | `findMultiplePriceColumns()` |

---

## 5. TypeScript 파서 유지 + FastAPI 도입 — 최소 운영 구조 제안

### 현재 구조의 병목

```
[Browser] → [Next.js API Route] → 파싱 + 지오코딩(순차) + 인메모리 캐시
                                   ↑ 단일 함수 660줄, 서버리스 환경에서 캐시/레이트리밋 무효
```

### 제안: 역할 분리 아키텍처

```
┌─────────────────────────────────┐
│  Next.js (프론트엔드 + BFF)      │
│  - 페이지 렌더링                  │
│  - 파일 업로드 프록시              │
│  - LH/SH/GH 공고 API 프록시      │
│  - 클라이언트 파싱(Worker) 유지    │
│  - 기존 지도/마커/필터 로직 유지    │
└─────────┬───────────────────────┘
          │ HTTP
┌─────────▼───────────────────────┐
│  FastAPI (백엔드)                │
│  1. /parse — Excel/CSV 파싱      │
│     → 기존 columnMappings 로직    │
│       Python openpyxl/pandas     │
│  2. /geocode — 배치 지오코딩      │
│     → asyncio 병렬 호출           │
│     → Redis 캐시                  │
│  3. /lh/notices — LH 공고 조회   │
│  4. /lh/detail — 첨부 다운로드+파싱│
│  5. /lh/attachment/parse         │
│     → LH Excel 자동 파싱          │
└─────────────────────────────────┘
```

### TypeScript 파서를 유지하는 이유와 범위

| 유지 (Next.js 측) | 이전 (FastAPI 측) |
|-------------------|-------------------|
| Web Worker 사전 검증 — UX 즉시 피드백 | 서버 파싱 — 정확한 데이터 변환 |
| 클라이언트 필터 로직 (`filterLocations`) | 지오코딩 — 병렬화, 캐시, 레이트리밋 |
| 타입 정의 (`types/`) — 프론트에서 계속 사용 | LH 첨부파일 다운로드 + 파싱 |
| 데이터셋 관리 (sessionStorage → 향후 서버) | 외부 API 통합 (LH/SH/GH) |

### 최소 운영 구조 (Phase 1)

```
Phase 1: FastAPI 지오코딩 서버 분리
├── FastAPI
│   ├── POST /geocode/batch     <- 주소 배열 → 좌표 배열 (asyncio + Redis)
│   └── GET  /lh/notices        <- 기존 /api/lh 이전
└── Next.js
    ├── /api/upload → 파싱만 수행, 지오코딩은 FastAPI 호출
    └── 나머지 프론트 그대로

Phase 2: LH 첨부파일 자동 파싱
├── FastAPI
│   ├── POST /lh/attachment/parse  <- 첨부 Excel 다운로드+파싱
│   └── POST /parse/excel          <- 범용 Excel 파싱 (Python openpyxl)
└── Next.js
    └── Worker 사전검증은 유지, 서버 파싱은 FastAPI로 위임

Phase 3: TypeScript 서버 파싱 제거
├── FastAPI: 모든 파싱/지오코딩/외부 API
└── Next.js: 순수 프론트엔드 + BFF 프록시
```

### FastAPI 도입의 핵심 이점

1. **지오코딩 병렬화**: `asyncio.gather()`로 현재 순차 호출 → 병렬 처리 (현재 병목)
2. **Redis 캐시**: 인메모리 캐시의 서버리스 한계 해소
3. **LH 첨부 파싱**: Python의 `openpyxl`/`pandas`가 셀 병합, 다중 시트, EUC-KR 인코딩 등 한국 공공기관 Excel에 더 강력
4. **관심사 분리**: 프론트엔드 빌드와 백엔드 배포를 독립적으로 관리

### 제안 — 공유 타입 전략

```
shared/
├── schemas.ts        <- TypeScript 타입 (프론트용)
└── schemas.py        <- Pydantic 모델 (FastAPI용)
    # 또는 OpenAPI spec에서 양쪽 자동 생성
```

### 미확인 사항
- 배포 환경 (Vercel? 자체 서버?) — FastAPI 호스팅 전략에 영향
- 현재 트래픽 규모 — Redis 도입의 비용 대비 효과
- Python 파서와 기존 TypeScript `columnMappings`의 동작 일치 검증 필요

---

## 요약 매트릭스

| 항목 | 확인한 사실 | 제안 | 미확인 |
|------|-----------|------|--------|
| 1. 데이터 흐름 | 클라이언트/서버 이중 파싱, 순차 지오코딩, 인메모리 캐시 | 파싱 1회화, 지오코딩 병렬화 | 대용량 성능, VWorld 한도 |
| 2. LH 연동 | 공고 목록 조회만 구현, 탭 UI 주석 처리, 지도 연결 없음 | 첨부파일 파싱 파이프라인 신규 개발 | LH 첨부 구조, 상세 API 존재 여부 |
| 3. 파서 재사용 | 순수 함수 다수 (헤더탐색, 값파싱, 필터, 그룹핑) | `shared/` 레이어 분리, route.ts 함수 추출 | — |
| 4. LH 파일 가정 | 11개 검증 항목 식별 | 실제 LH Excel 3-5건으로 검증 | 전체 미확인 |
| 5. 구조 제안 | Next.js + FastAPI 분리 가능 | 3단계 점진적 이전, Phase 1은 지오코딩 분리 | 배포 환경, 트래픽 규모 |
