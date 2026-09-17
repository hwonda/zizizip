# CLAUDE.md

## Project Status

**zizizip 2.0** 전환 중. 1.0(수동 업로드+지도)은 운영 중이며, 2.0은 LH 공고 자동 수집+추천을 추가한다.

현재 단계: **Phase 0 착수 전** — PoC 완료, 작업 목록 확정.

## Repository Structure

```
zizizip/
├── src/                  # Next.js 프론트엔드 (1.0, 운영 중)
│   ├── app/              # 페이지, API 라우트
│   ├── components/       # React 컴포넌트
│   ├── hooks/            # 커스텀 훅
│   ├── stores/           # Zustand 스토어
│   ├── types/            # TypeScript 타입
│   ├── utils/            # 유틸리티 함수
│   ├── workers/          # Web Worker
│   ├── styles/           # SCSS
│   └── constants/        # 메타데이터, 분석 태그
├── poc/                  # PoC 스크립트
│   ├── lh_attachment_poc.py
│   └── downloads/        # (.gitignore)
├── docs/                 # 기획·분석·참고 문서
│   ├── ZIZIZIP_2.0_실행기획안.md
│   ├── ZIZIZIP_2.0_ANALYSIS.md
│   ├── POC_REPORT.md
│   └── OpenAPI활용가이드_...docx
├── samples/              # 수동 테스트용 원본 파일
├── TODO.md               # 작업 목록 + 문서 인덱스
├── CLAUDE.md             # 이 파일
└── README.md             # 프로젝트 소개
```

## Development Commands

- `npm run dev` — 개발 서버 (Turbopack, port 8253)
- `npm run build` — 프로덕션 빌드
- `npm run lint` — ESLint 검사
- `python3 poc/lh_attachment_poc.py` — LH 첨부 다운로드 PoC

## Environment Variables (.env.local)

- `NEXT_PUBLIC_VWORLD_API_KEY` — VWorld 지오코딩 (필수)
- `NEXT_PUBLIC_LH_API_KEY` — LH 공고 API (필수)

## Code Style

- 싱글 쿼트, 세미콜론 필수, 2스페이스 인덴트
- 템플릿 리터럴: `${ variable }` (공백 있음)
- JSX: props에 중괄호 없음, children에 중괄호
- 셀프클로징: `<Component />`
- 후행 쉼표: 멀티라인에서 필수
- 화살표 함수: `(x) => x`
- `npm run lint`로 확인

## 1.0 Architecture (현재 운영 중)

### Data Flow

파일 업로드 → 서버 파싱(papaparse/xlsx) + VWorld 지오코딩 → sessionStorage 저장 → CustomEvent → OpenLayers 마커

### Key Files

| 역할 | 파일 |
|------|------|
| 지도 페이지 | `src/app/map/page.tsx`, `src/components/map/MapPageClient.tsx` |
| 업로드 API | `src/app/api/upload/route.ts` (파싱+지오코딩, 660줄) |
| LH API | `src/app/api/lh/route.ts` (목록 조회만, 지도 미연결) |
| 데이터셋 관리 | `src/hooks/useDatasetManager.ts` (sessionStorage) |
| 마커 렌더링 | `src/components/map/MarkerManager.tsx` |
| 필터 | `src/stores/useFilterStore.ts`, `src/utils/filterLocations.ts` |
| 타입 | `src/types/index.ts` (LocationData), `src/types/lh.ts` (LHNotice) |

### 1.0 Known State

- LH 탭 UI는 구현되어 있으나 `NavigationWrapper.tsx`에서 주석 처리됨
- LH 공고 선택 → 지도 마커 연결은 미구현
- SH/GH는 스텁만 존재 (API 라우트, 타입, 사이드바 모두 없음)
- 지오코딩은 순차 실행, 인메모리 캐시 (서버리스에서 인스턴스 간 공유 불가)

## 2.0 Plan Summary

자세한 내용은 `docs/ZIZIZIP_2.0_실행기획안.md` 참고.

- **목표**: 로그인 → 설문 → LH 매입임대 맞춤 공고 추천
- **대상**: 청년, 신혼부부, 신생아가구, 고령자 (서울, LH)
- **스택**: Next.js(Vercel) + FastAPI + Supabase(Auth/DB) + GitHub Actions
- **월 비용**: 0원 목표 (무료 티어 조합)
- **PoC 결과**: LH 첨부 자동 다운로드 성공 — `poc/README.md` 참고

## Notes

- 코드 변경 전 불분명한 점은 먼저 확인할 것
- Tailwind CSS 사용, 글로벌 스타일은 `src/styles/globals.scss`
- 색상: text-main, text-accent-1, text-gray-1~9
