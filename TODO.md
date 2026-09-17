# ZIZIZIP 2.0 작업 목록

기준일: 2026-09-17. PoC 완료 후 정리.

## 관련 문서

| 문서 | 위치 | 내용 |
|------|------|------|
| 코드베이스 분석 | `docs/ZIZIZIP_2.0_ANALYSIS.md` | 1.0 데이터 흐름, 파서 재사용성, 구조 제안 |
| 실행 기획안 | `docs/ZIZIZIP_2.0_실행기획안.md` | 확정 요구, 제품 동작, 기술 구조, 비용 정책 |
| PoC 결과 보고 | `docs/POC_REPORT.md` | LH 첨부 자동 확보 검증 결과 |
| LH API 가이드 | `docs/OpenAPI활용가이드_...docx` | data.go.kr 공식 명세 |
| PoC 스크립트 | `poc/lh_attachment_poc.py` | 실행 가능한 검증 코드 |
| 수동 테스트 파일 | `samples/` | 기존 1.0 업로드 테스트용 CSV/Excel |

## 완료

- [x] 코드베이스 분석
- [x] 실행 기획안 작성
- [x] LH 첨부파일 자동 확보 PoC
  - LH API → 상세 HTML → fileId 추출 → 쿠키 없이 다운로드 성공
  - 서울+매입임대 3종(청년, 신혼Ⅰ, 신혼Ⅱ) Excel 구조 확인
  - 금액 단위: 원, 병합 헤더 2~3단, 가격 세트 2~4개

---

## Phase 0 — 수집 파이프라인 (백엔드 기반)

PoC를 운영 가능한 수집기로 발전시키는 단계. 프론트 변경 없음.

### 0-1. Python 프로젝트 구조 잡기
- [ ] `backend/` 디렉토리 생성, pyproject.toml, venv
- [ ] FastAPI 최소 뼈대 (health check 엔드포인트)
- [ ] Supabase 프로젝트 생성 (Auth + PostgreSQL)
- [ ] DB 스키마 설계: notices, housing_units, geocode_cache
- [ ] 환경변수 관리 (.env, 배포용 분리)

### 0-2. LH 공고 수집기
- [ ] PoC를 모듈화 (poc/ → backend/collector/)
- [ ] 공고 목록 전체 페이지네이션 수집
- [ ] 상세 HTML에서 공급주택목록 fileId 추출
- [ ] Excel 다운로드 + 원본 파일 Supabase Storage 저장
- [ ] 파일 해시 비교로 중복 다운로드 방지
- [ ] 수집 이력 DB 기록 (마지막 성공 시각, 건수)

### 0-3. Excel 파서 (Python)
- [ ] 병합 헤더 해석: 상위 행에서 가격 세트 적용 대상 추출
- [ ] 청년 양식 파서 (공급형, 성별용도 추가 컬럼)
- [ ] 신혼Ⅰ 양식 파서 (계층별 4세트)
- [ ] 신혼Ⅱ 양식 파서 (소득구간별 2세트)
- [ ] 공통 컬럼 매핑 (주소, 동, 호, 면적, 방수, 층수, 승강기, 주택유형)
- [ ] 파싱 결과 → DB 저장 (housing_units 테이블)
- [ ] 기존 TypeScript columnMappings와 기대값 비교 테스트

### 0-4. 배치 지오코딩
- [ ] VWorld API 비동기 병렬 호출 (asyncio/aiohttp)
- [ ] 좌표 결과 DB 캐시 (geocode_cache: 주소 → lat/lon)
- [ ] 기존 refineAddress 로직 Python 포팅
- [ ] 실패 주소 로깅 + 재시도 정책

### 0-5. GitHub Actions 자동화
- [ ] 수집 CLI 스크립트: `python -m backend.collector`
- [ ] cron 워크플로 (일 1회)
- [ ] 수동 실행 (workflow_dispatch)
- [ ] 실행 결과 알림 (실패 시 issue 자동 생성 또는 로그)
- [ ] Actions 무료 사용량 내 실행시간 측정

---

## Phase 1 — API 서버 + 프론트 연결

수집된 데이터를 사용자에게 보여주는 단계.

### 1-1. FastAPI 공고/주택 조회 API
- [ ] `GET /notices` — 공고 목록 (필터: 지역, 대상, 상태)
- [ ] `GET /notices/{id}` — 공고 상세 + 주택 목록
- [ ] `GET /housing` — 주택 검색 (지역, 면적, 가격 범위)
- [ ] 응답 형식을 기존 LocationData 타입과 호환되게 설계
- [ ] FastAPI 배포 (Vercel Serverless or 대안 검토)

### 1-2. Next.js에서 공고 데이터 표시
- [ ] NavigationWrapper 탭 활성화 (LH 탭 주석 해제)
- [ ] LHSidebar → FastAPI 연동 (기존 data.go.kr 직접 호출 대체)
- [ ] 공고 선택 → 주택 목록 로드 → 기존 LocationData로 변환
- [ ] 기존 마커 파이프라인에 합류 (MarkerManager, PopupOverlay)
- [ ] 필터 패널과 연동 (가격/면적/층수 필터 작동 확인)

### 1-3. Vercel 배포 구성
- [ ] FastAPI 프로젝트 Vercel 배포 또는 대안 결정
- [ ] Hobby 플랜 타임아웃 제약 확인 (10초)
- [ ] Next.js → FastAPI CORS 설정
- [ ] 환경변수 설정 (Supabase URL, API 키)

---

## Phase 2 — 로그인 + 설문 + 추천

개인화 기능. Phase 1 완료 후 시작.

### 2-1. 인증
- [ ] Supabase Auth 설정 (Google OAuth)
- [ ] Next.js 로그인/로그아웃 UI
- [ ] FastAPI에서 Supabase JWT 검증 미들웨어
- [ ] 비로그인 사용자 접근 범위 확정 (기존 업로드+지도, 공고 열람)
- [ ] RLS 정책: 본인 데이터만 접근

### 2-2. 설문
- [ ] DB 스키마: user_profiles (관심 대상, 희망 지역, 주거 조건)
- [ ] FastAPI: `POST /profile`, `GET /profile`
- [ ] Next.js: 설문 3단계 UI (관심 대상 → 지역 → 조건)
- [ ] 재방문 시 설문 스킵, 수정 가능

### 2-3. 추천
- [ ] 추천 로직 v1 (PLAN.md 규칙 구현)
  - 관심 대상 × 공고 모집 대상 교집합
  - 희망 지역 일치
  - 예산 내 임대조건 (동일 주택 동일 세트 내 비교)
  - 적용 계층 확인/미확인 구분
- [ ] `GET /recommendations` API
- [ ] Next.js: 추천 공고 목록 UI
- [ ] 정렬: 대상 태그 → 선호 일치 수 → 마감 순 → ID 순

---

## Phase 3 — 안정화 + 확장

출시 후 운영 안정화.

### 3-1. 안정화
- [ ] Supabase 비활성 일시정지 대응 (keep-alive 또는 수집이 충분한지 확인)
- [ ] 수집 실패 모니터링 + 수동 재실행 기능
- [ ] LH 사이트 HTML 구조 변경 감지 (fileId 추출 패턴 검증)
- [ ] 마감된 공고의 첨부 접근 유효기간 확인

### 3-2. 파서 확장
- [ ] 고령자 매입임대 Excel 양식 확보 + 파서 추가
- [ ] 다른 지역본부 양식 호환성 검증
- [ ] 일반 매입임대 양식 대응

### 3-3. 미정 (사용자 판단 필요)
- [ ] SH/GH 공고 대응 (API 엔드포인트 조사부터)
- [ ] 카카오 등 추가 소셜 로그인
- [ ] 기존 수동 업로드 기능 유지/분리 결정
- [ ] 모바일 최적화

---

## 결정 필요 사항

Phase 0 착수 전 확정이 필요한 항목:

1. **FastAPI 호스팅**: Vercel Serverless (10초 제한) vs Fly.io free vs Railway
2. **DB 스키마 리뷰**: notices/housing_units 테이블 구조
3. **비로그인 사용자 범위**: 공고 열람만? 지도 표시도?
4. **기존 수동 업로드 기능**: 2.0에서 유지? 별도 탭?
