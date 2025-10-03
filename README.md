# 리얼타임 실시간 검색어 - Chrome Extension

네이버와 구글에서 실시간 급상승 검색어를 제공하는 크롬 확장 프로그램입니다.

## 🚀 주요 기능

- **리얼타임 트렌드 표시**: 네이버, 구글 메인 페이지와 검색 결과 페이지에 리얼타임 급상승 검색어 표시
- **검색 쿼리 저장**: 사용자의 검색 기록을 자동으로 저장하고 분석
- **키워드 추출**: TensorFlow.js를 활용한 AI 기반 키워드 추출 및 분석
- **데이터 내보내기**: 저장된 검색 데이터를 JSON 형태로 내보내기

## 🛠 기술 스택

- **Frontend**: React 17 + TypeScript
- **UI Library**: Material-UI 4
- **AI/ML**: TensorFlow.js
- **Extension**: Chrome Extension Manifest V3
- **Build Tool**: Webpack 4

## 📁 프로젝트 구조

```
src/
├── components/         # React 컴포넌트
│   ├── Chart.tsx      # 트렌드 차트 컴포넌트
│   └── ChartRow.tsx   # 차트 행 컴포넌트
├── scripts/           # 확장 프로그램 스크립트
│   ├── background.ts  # 백그라운드 서비스 워커
│   └── content.tsx    # 컨텐트 스크립트
├── types/             # TypeScript 타입 정의
├── utils/             # 유틸리티 함수
│   └── keywordExtractor.ts  # AI 키워드 추출
├── index.tsx          # 팝업 메인
├── popup.tsx          # 설정 팝업
├── queries.tsx        # 검색 기록 페이지
├── queries-index.tsx  # 검색 기록 앱 엔트리
├── trends.tsx         # 트렌드 데이터 관리
└── searchQueries.ts   # 검색 쿼리 저장/관리
```

## 🔧 개발 환경 설정

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm start
```

### 3. 빌드
```bash
# 메인 확장 프로그램 빌드
npm run build

# 검색 쿼리 페이지 빌드
npm run build:queries
```

### 4. TypeScript 타입 체크
```bash
npm run tsc
```

## 📦 확장 프로그램 설치

1. `npm run build` 실행하여 빌드
2. Chrome 브라우저에서 `chrome://extensions/` 접속
3. 개발자 모드 활성화
4. "압축해제된 확장 프로그램을 로드합니다" 클릭
5. 프로젝트의 `build` 폴더 선택

## 🎯 사용법

1. **설정**: 확장 프로그램 아이콘 클릭하여 네이버/구글 트렌드 표시 on/off
2. **트렌드 확인**: 네이버나 구글 메인 페이지에서 실시간 급상승 검색어 확인
3. **검색 기록**: 확장 프로그램 아이콘 클릭 시 검색 기록 페이지 열림
4. **데이터 내보내기**: 검색 기록 페이지에서 JSON 파일로 데이터 내보내기

## 🔍 주요 기능 상세

### 리얼타임 트렌드
- 1분마다 최신 트렌드 데이터 업데이트
- 네이버, 구글 각각의 트렌드 표시
- 클릭 시 해당 검색어로 검색 이동

### 검색 쿼리 분석
- 사용자 검색어 자동 감지 및 저장
- TensorFlow.js 기반 키워드 추출
- 중복 검색어 방지 (10분 내 동일 검색어)

### 서버 연동
- 원격 서버와의 데이터 동기화
- JWT 토큰 기반 인증
- 자동 토큰 갱신

## 📋 스크립트 명령어

- `npm start`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드
- `npm run build:queries`: 검색 쿼리 페이지 빌드
- `npm test`: 테스트 실행
- `npm run tsc`: TypeScript 타입 체크
- `npm run tsc:watch`: TypeScript 타입 체크 (watch 모드)

## 🔧 개발 참고사항

- Manifest V3 기반으로 개발
- Content Security Policy 적용
- Chrome Storage API 사용
- 브라우저 호환성: Chrome 88+

## 📝 라이선스

이 프로젝트는 개인 프로젝트입니다.
