# ZIZIZIP 2.0 작업 목록

기준일: 2026-09-17. PoC 완료 후 정리. 피드백 반영 (2026-09-17).

## 관련 문서

| 문서 | 위치 | 내용 |
|------|------|------|
| 코드베이스 분석 | `docs/ZIZIZIP_2.0_ANALYSIS.md` | 1.0 데이터 흐름, 파서 재사용성, 구조 제안 |
| 실행 기획안 | `docs/ZIZIZIP_2.0_실행기획안.md` | 확정 요구, 제품 동작, 기술 구조, 비용 정책 |
| PoC 결과 보고 | `docs/POC_REPORT.md` | LH 첨부 자동 확보 검증 결과 |
| LH API 가이드 | `docs/OpenAPI활용가이드_...docx` | data.go.kr 공식 명세 |
| PoC 스크립트 | `poc/lh_attachment_poc.py` | 실행 가능한 검증 코드 |
| 수동 테스트 파일 | `samples/` | 기존 1.0 업로드 테스트용 CSV/Excel |

## 착수 전 결정 (확정)

| 항목 | 결정 |
|------|------|
| FastAPI 호스팅 | **Vercel** (Hobby Python 함수 최대 300초) |
| 수집·파싱·지오코딩 | **GitHub Actions** (일 1회 cron + 수동 실행) |
| DB·Auth·Storage | **Supabase** Free |
| 비로그인 사용자 범위 | 공고 목록·지도 열람 허용. 맞춤 추천·관심 저장은 로그인 필요 |
| 기존 수동 업로드 | 별도 탭으로 유지 |
| 고령자 첫 출시 지원 | 공고 목록·원문 링크 제공. 지도·가격 추천은 파서 확보 후. UI에 지원 수준 명시 |

## 완료

- [x] 코드베이스 분석
- [x] 실행 기획안 작성
- [x] LH 첨부파일 자동 확보 PoC
  - LH API → 상세 HTML → fileId 추출 → 쿠키 없이 다운로드 성공
  - 서울+매입임대 3종(청년, 신혼Ⅰ, 신혼Ⅱ) Excel 구조 확인
  - 금액 단위: 원, 병합 헤더 2~3단, 가격 세트 2~4개

## 진행 원칙

Phase 0 전체를 끝낸 뒤 지도 연결이 아니라, **공고 한 건을 일찍 끝까지 연결**한다.

```
최소 DB·FastAPI 배포 → 공고 한 건 수집·파싱 → 지도 연결
→ 반복 수집 확대 → 로그인·설문·추천 → 출시 검증
```

---

## Phase 0 — 수집 파이프라인 + 첫 연결

### 0-1. 프로젝트 구조 + 최소 배포 검증
- [x] `backend/` 디렉토리 생성, pyproject.toml, venv
- [x] FastAPI 최소 뼈대 (health check, notices, housing stub)
- [ ] **Vercel에 FastAPI 배포 검증** (300초 제한 확인, CORS 설정)
- [x] Supabase 프로젝트 생성 (Auth + PostgreSQL + Storage)
- [x] 환경변수 관리 (.env.local에 SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY 추가)

### 0-2. DB 스키마

```
notices             공고 메타 (PAN_ID, 공고명, 기간, 상태, 유형, 지역, DTL_URL)
notice_files        원본 URL, fileId, 파일 해시, 파일 버전, 파싱 상태
housing_units       주택 정보 (주소, 동, 호, 면적, 방수, 층수, 승강기, 주택유형, 좌표)
rental_options      주택별 가격 조합
  - housing_unit_id
  - eligibility_group       적용 계층 (수급자, 소득70%, 청년1순위 등)
  - eligibility_label_raw   원본 헤더 문구
  - option_type             기본 / 최대전환
  - deposit
  - monthly_rent
  - source_file_id
  - source_row
notice_schedules    게시일, 접수 일정, 대상별 일정 구분
geocode_cache       주소 → lat/lon (원본 주소 보존)
collection_runs     수집 실행 이력 (시각, 상태, 공고·파일·처리 단계별 결과)
```

- [x] 스키마 SQL 작성 (`backend/sql/001_schema.sql`)
- [ ] Supabase SQL Editor에서 스키마 실행
- [ ] rental_options: 적용 계층이 다른 가격을 자유 선택 옵션으로 취급하지 않음

### 0-3. 공고 한 건 수집 → 파싱 → 지도 연결 (수직 관통)
- [ ] PoC를 모듈화 (poc/ → backend/collector/)
- [ ] 서울+매입임대 공고 1건 수집 → notice_files에 기록
- [ ] 첨부 다운로드 → Supabase Storage 저장
- [ ] Excel 파서: 병합 헤더 해석 → housing_units + rental_options 저장
- [ ] 지오코딩: 해당 공고 주소 → geocode_cache 저장
- [ ] FastAPI: `GET /notices`, `GET /notices/{id}` 최소 구현
- [ ] Next.js: LH 탭 활성화, FastAPI에서 데이터 로드, 지도 마커 표시
- [ ] **한 건이 지도에 뜨는 것을 확인한 뒤 다음 진행**

### 0-4. Excel 파서 확장
- [ ] 청년 양식 (공급형, 성별용도 추가 컬럼)
- [ ] 신혼Ⅰ 양식 (계층별 4세트)
- [ ] 신혼Ⅱ 양식 (소득구간별 2세트)
- [ ] 공통 컬럼 매핑 (주소, 동, 호, 면적, 방수, 층수, 승강기, 주택유형)
- [ ] 완료 기준 (기존 TS 파서가 아닌 공식 Excel 기준):
  - 신혼Ⅰ 65행, 신혼Ⅱ 242행 보존
  - 가격의 적용 계층과 조합(기본/최대전환) 보존
  - 청년의 공급형·성별용도 의미 보존
  - 빈 값과 0 구분
  - 헤더 변경 시 잘못 저장하지 않고 검토 대상으로 분류

### 0-5. 배치 지오코딩
- [ ] VWorld API 비동기 호출 (동시 요청 수 제한, 타임아웃, 재시도 간격)
- [ ] 중복 주소 제거 후 호출
- [ ] 원본 주소 보존, 정제 주소와 분리 저장
- [ ] refineAddress는 그대로 포팅하지 않고 실제 주소로 검증 후 적용
- [ ] 실패 주소 로깅 + 부분 재시도

### 0-6. 변경 감지와 중복 처리 방지
- [ ] ETag/Last-Modified 등 변경 확인 수단이 있으면 조건부 다운로드
- [ ] 다운로드 후 내용 해시가 같으면 중복 저장·파싱·지오코딩 생략
- [ ] 같은 URL/fileId라도 내용 변경 가능성 고려
- [ ] 같은 수집 작업을 재실행해도 중복 데이터가 생기지 않음 (멱등성)

### 0-7. 수정·취소·부분 실패 처리
- [ ] 같은 공고의 변경된 첨부파일 감지
- [ ] 신규 버전 검증 성공 후 공개 데이터 교체
- [ ] 파싱 실패 시 마지막 정상 데이터 유지
- [ ] 정정 공고에서 삭제된 주택 처리
- [ ] 취소·마감 상태 갱신
- [ ] 목록에서 일시적으로 사라진 공고를 취소로 단정하지 않음
- [ ] 수집 실패 기록에 공고·파일·처리 단계를 남겨 부분 재실행 가능

### 0-8. GitHub Actions 자동화
- [ ] 수집 CLI: `python -m backend.collector`
- [ ] cron 워크플로 (일 1회)
- [ ] 수동 실행 (workflow_dispatch)
- [ ] 자동 실행과 수동 실행의 동시 실행 제한
- [ ] 실행 결과 알림 (실패 시 issue 자동 생성 또는 로그)
- [ ] Actions 무료 사용량 내 실행시간 측정
- [ ] HTML 구조 변경·첨부 추출 실패 감지 (fileId 패턴 검증)

---

## Phase 1 — API 서버 + 프론트 연결 확대

### 1-1. FastAPI 조회 API
- [ ] `GET /notices` — 공고 목록 (필터: 지역, 대상, 상태) + 페이지네이션
- [ ] `GET /notices/{id}` — 공고 상세 + 주택 목록 (페이지네이션, 무제한 포함 금지)
- [ ] `GET /housing` — 주택 검색 (지역, 면적, 가격 범위, bbox, 최대 결과 수)
- [ ] 좌표 미확인 주택은 목록에 남기되 지도에서 제외
- [ ] API는 공고·주택·임대조건·출처를 보존하는 응답을 제공
- [ ] 프론트 어댑터에서 기존 LocationData 타입으로 변환 (API 응답에서 계층·공고ID·출처를 버리지 않음)

### 1-2. Next.js 연동 확대
- [ ] NavigationWrapper 탭 전체 활성화
- [ ] 공고 선택 → 주택 목록 로드 → 어댑터 → 마커 파이프라인
- [ ] 필터 패널과 연동 (가격 필터에 적용 계층 구분 반영)
- [ ] 모바일 기본 사용성 확보

---

## Phase 2 — 로그인 + 설문 + 추천

### 2-1. 인증
- [ ] Supabase Auth 설정 (Google OAuth)
- [ ] Next.js 로그인/로그아웃 UI
- [ ] FastAPI에서 Supabase JWT 검증 미들웨어
- [ ] RLS 정책: 본인 데이터만 접근
- [ ] 로그인 취소·실패·세션 만료 처리
- [ ] 사용자 A가 B의 프로필·관심 공고에 접근하지 못하는지 검증
- [ ] 계정 삭제 시 개인 데이터 정리

### 2-2. 설문
- [ ] DB: user_profiles (관심 대상, 희망 지역, 주거 조건)
- [ ] `GET /me/profile`, `PATCH /me/profile`
- [ ] Next.js: 설문 3단계 UI (관심 대상 → 지역 → 조건)
- [ ] 재방문 시 설문 스킵, 수정 가능
- [ ] 설문 수정 후 추천 갱신
- [ ] 설문 미완료 상태 화면

### 2-3. 추천
- [ ] 추천 로직 v1 (`docs/ZIZIZIP_2.0_실행기획안.md` 규칙 구현)
  - 관심 대상 × 공고 모집 대상 교집합
  - 희망 지역 일치
  - 예산 내 임대조건 (동일 주택 동일 세트 내, 적용 계층 구분 비교)
  - 적용 계층 확인/미확인 구분 표시
- [ ] `GET /me/recommendations` + 페이지네이션
- [ ] 추천 없음 화면, 가격 적용 계층 미확인 안내
- [ ] 정렬: 대상 태그 → 선호 일치 수 → 마감 순 → ID 순

### 2-4. 관심 공고
- [ ] `POST /me/favorites`, `DELETE /me/favorites/{id}`, `GET /me/favorites`
- [ ] Next.js: 관심 저장·해제 UI, 관심 목록 화면

---

## Phase 3 — 안정화 + 확장

### 3-1. 운영 안정화
- [ ] Supabase 일시정지 감지·화면 안내·복구 절차
- [ ] 마감된 공고의 첨부 접근 유효기간 확인

### 3-2. 파서 확장
- [ ] 고령자 매입임대 Excel 양식 확보 + 파서 추가
- [ ] 다른 지역본부 양식 호환성 검증
- [ ] 일반 매입임대 양식 대응

### 3-3. 미정
- [ ] SH/GH 공고 대응 (API 엔드포인트 조사부터)
- [ ] 카카오 등 추가 소셜 로그인
