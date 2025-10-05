# 지지집 (zizizip)

> CSV/Excel 파일을 업로드하여 LH, SH 공고의 부동산을 지도에서 한눈에 확인하는 Next.js 기반 위치 지도 서비스

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/TailwindCSS-4-skyblue)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 주요 기능

- 📊 **CSV/Excel 파일 업로드**: 부동산 데이터를 간편하게 업로드
- 🗺️ **인터랙티브 지도**: OpenLayers 기반 실시간 지도 표시
- 📍 **자동 주소 변환**: VWorld API를 통한 주소 → 좌표 자동 변환
- 🎨 **다중 데이터셋 관리**: 여러 데이터셋을 색상별로 구분하여 비교
- 🔍 **위치 기반 검색**: 지도에서 직접 매물 위치 확인
- 💾 **세션 저장**: 업로드한 데이터를 브라우저에 자동 저장

## 기술 스택

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Language**: TypeScript 5
- **지도 라이브러리**: OpenLayers
- **스타일링**: TailwindCSS
- **상태 관리**: React Hooks + SessionStorage
- **데이터 파싱**: xlsx
- **지오코딩 API**: VWorld API

## 시작하기

### 사전 요구사항

- Node.js 20 이상
- npm, yarn, pnpm 또는 bun

### 설치

```bash
# 저장소 클론
git clone https://github.com/yourusername/zizizip.git
cd zizizip

# 의존성 설치
npm install
```

### 환경 변수 설정

`.env.local` 파일을 생성하고 VWorld API 키를 설정하세요:

```env
NEXT_PUBLIC_VWORLD_API_KEY=your_vworld_api_key_here
```

> VWorld API 키는 [VWorld 오픈 API](https://www.vworld.kr/dev/v4dv_apidevguide2_s001.do)에서 발급받을 수 있습니다.

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 사용 방법

1. **파일 준비**: LH, SH 등의 부동산 공고 데이터를 CSV 또는 Excel 형식으로 준비
2. **파일 업로드**: 상단 내비게이션에서 파일 업로드
3. **지도 확인**: 자동으로 주소가 좌표로 변환되어 지도에 표시됨
4. **데이터셋 관리**: 여러 파일을 업로드하여 색상별로 비교 가능
5. **마커 클릭**: 지도의 마커를 클릭하여 상세 정보 확인

### CSV/Excel 파일 형식

지원하는 컬럼 (유연한 매핑):
- 주소: `주소`, `소재지`, `위치`
- 이름: `이름`, `명칭`, `물건명`
- 건물명: `건물명`, `단지명`
- 호수: `호수`, `동호수`
- 면적: `전용면적`, `공급면적`
- 방/욕실: `방`, `욕실`
- 가격: `매매가`, `보증금`, `월세`

## 프로젝트 구조

```
zizizip/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/upload/        # 파일 업로드 API
│   │   ├── map/               # 지도 페이지
│   │   └── layout.tsx         # 루트 레이아웃
│   ├── components/            # React 컴포넌트
│   │   ├── map/              # 지도 관련 컴포넌트
│   │   └── common/           # 공통 컴포넌트
│   ├── hooks/                # Custom Hooks
│   │   └── useDatasetManager.ts
│   ├── types/                # TypeScript 타입 정의
│   ├── styles/               # 전역 스타일
│   └── constants/            # 상수 및 메타데이터
├── public/                   # 정적 파일
└── README.md
```

## API

### POST /api/upload

파일을 업로드하고 주소를 좌표로 변환합니다.

**Request:**
- `Content-Type: multipart/form-data`
- `file`: CSV 또는 Excel 파일

**Response:**
```json
{
  "data": [
    {
      "address": "서울특별시 강남구...",
      "lat": 37.1234,
      "lon": 127.5678,
      "name": "아파트명",
      "price": { "sale": 500000000 }
    }
  ]
}
```

## 기여하기

기여는 언제나 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 코드 스타일

프로젝트는 ESLint를 사용합니다:

```bash
npm run lint
```

## 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 문의

프로젝트 관련 문의사항이나 버그 리포트는 [Issues](https://github.com/yourusername/zizizip/issues)에 등록해주세요.

## 참고 자료

- [Next.js Documentation](https://nextjs.org/docs)
- [OpenLayers Documentation](https://openlayers.org/doc/)
- [VWorld API](https://www.vworld.kr/dev/v4dv_apidevguide2_s001.do)
