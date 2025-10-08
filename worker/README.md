# Realtime Trends Crawler

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-yellow)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

실시간 트렌드 데이터를 수집하고 분석하는 Cloudflare Workers 기반 크롤러입니다. 한국의 주요 포털 사이트(Nate, Zum)에서 실시간 검색어를 수집하여 Supabase에 저장하고 통합 트렌드 데이터를 제공합니다.

## 🚀 주요 기능

- **서버리스 아키텍처**: Cloudflare Workers 기반 무서버 실행 환경
- **다중 소스 크롤링**: Nate, Zum 포털의 실시간 검색어 수집
- **트렌드 점수 계산**: 가중치 기반 통합 점수 산출
- **중복 키워드 처리**: 유사한 키워드 통합 및 점수 합산
- **변화 추적**: 이전 순위와 비교하여 상승/하락 추이 계산
- **실시간 데이터베이스**: Supabase PostgreSQL을 통한 실시간 데이터 저장
- **자동 스케줄링**: 크론 작업을 통한 10분 간격 자동 실행
- **실시간 API**: Supabase 실시간 구독을 통한 즉시 데이터 업데이트

## 📁 프로젝트 구조

```
realtime-trends-crawler/
├── src/
│   └── worker.js           # Cloudflare Workers 메인 스크립트
├── supabase/
│   └── schema.sql          # Supabase 데이터베이스 스키마
├── wrangler.toml           # Cloudflare Workers 설정
├── package.json            # Node.js 의존성 및 스크립트
├── README.md               # 프로젝트 문서
└── legacy/                 # 기존 Python 코드 (참조용)
    ├── main.py            # 기존 메인 실행 파일
    ├── requirements.txt   # Python 의존성 목록
    ├── src/              # 기존 소스 코드
    ├── models/           # 기존 데이터 모델
    └── ref/              # 참조 파일
```

## 🔧 설치 및 배포

### 사전 요구사항
- Node.js 18+
- Cloudflare Workers 계정
- Supabase 프로젝트
- Wrangler CLI

### 설치
```bash
# 저장소 클론
git clone https://github.com/realtime-trends/realtime-trends-crawler.git
cd realtime-trends-crawler

# 의존성 설치
npm install

# Wrangler CLI 설치 (전역)
npm install -g wrangler
```

### Supabase 설정
1. Supabase 프로젝트 생성
2. 데이터베이스 스키마 적용:
```sql
-- supabase/schema.sql 파일의 내용을 Supabase SQL 에디터에서 실행
```

### Cloudflare Workers 설정
1. Wrangler 로그인:
```bash
wrangler login
```

2. 환경 변수 설정:
```bash
# Supabase URL과 키를 Cloudflare Workers 환경 변수로 설정
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
```

### 배포
```bash
# 개발 서버 실행
npm run dev

# 프로덕션 배포
npm run deploy
```

### 수동 실행 (테스트용)
```bash
# POST 요청으로 수동 트리거
curl -X POST https://your-worker-domain.workers.dev/trigger
```

## 📊 데이터 수집 방식

### 1. 포털별 크롤링
- **Zum**: HTML 파싱을 통한 실시간 검색어 추출
- **Nate**: JSON API를 통한 실시간 검색어 수집

### 2. 점수 계산 시스템
```python
WEIGHTS = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11]  # 순위별 가중치
ENGINE_BIAS = {
    "nate": 0.7,    # Nate 엔진 가중치
    "zum": 1.0,     # Zum 엔진 가중치
}
```

### 3. 키워드 처리
- 한자 → 한글 변환 (`hanja` 라이브러리 사용)
- 특수문자 제거 및 공백 정규화
- 제외 키워드 필터링 (`ref/except.txt`)

### 4. 유사도 처리
- 포함 관계 키워드 통합
- 유사도 가중치: 0.7

## 🔄 워크플로우

### 실행 주기
- 10분 간격 크론 작업 (`*/10 * * * *`)
- Cloudflare Workers 스케줄러를 통한 자동 실행

### 데이터 관리
1. **신규 데이터 수집**: 현재 타임스탬프로 트렌드 데이터 생성
2. **이전 데이터 비교**: 10분 전 데이터와 순위 변화 계산
3. **Supabase 저장**: PostgreSQL 데이터베이스에 구조화된 데이터 저장
4. **자동 정리**: 48개 타임스탬프 이전 데이터 자동 삭제 (8시간 보관)

## 📝 데이터 모델

### Supabase 테이블 구조

#### trends 테이블
```sql
CREATE TABLE trends (
  id BIGSERIAL PRIMARY KEY,
  timestamp BIGINT NOT NULL,        -- Unix 타임스탬프
  data JSONB NOT NULL,              -- 트렌드 데이터 JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### trend_entries 테이블 (개별 트렌드 엔트리)
```sql
CREATE TABLE trend_entries (
  id BIGSERIAL PRIMARY KEY,
  timestamp BIGINT NOT NULL,        -- Unix 타임스탬프
  keyword VARCHAR(255) NOT NULL,    -- 검색 키워드
  score FLOAT NOT NULL,             -- 통합 점수
  maxscore FLOAT NOT NULL,          -- 최대 점수
  hashed VARCHAR(16) NOT NULL,      -- 키워드 해시값
  delta INTEGER NOT NULL DEFAULT 999, -- 순위 변화
  rank INTEGER NOT NULL,            -- 현재 순위
  engine VARCHAR(10),               -- 출처 엔진 (nate/zum)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### exception_keywords 테이블
```sql
CREATE TABLE exception_keywords (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL UNIQUE, -- 제외할 키워드
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## ⚙️ Cloudflare Workers 아키텍처

서버리스 아키텍처로 구성된 자동화 시스템:

- **트리거**: 크론 스케줄 (`*/10 * * * *`) - 10분마다 자동 실행
- **환경**: Cloudflare Workers V8 런타임
- **수행 작업**:
  1. 포털 사이트 크롤링 (Nate, Zum)
  2. 키워드 전처리 및 점수 계산
  3. 이전 데이터와 비교하여 델타 계산
  4. Supabase 데이터베이스에 저장
  5. 오래된 데이터 자동 정리

### 실시간 데이터 접근
```javascript
// Supabase 클라이언트를 통한 실시간 데이터 구독
const { data, error } = await supabase
  .from('latest_trends')
  .select('*')
  .order('score', { ascending: false })
  .limit(10);
```

## 📋 의존성

### 프로덕션 의존성
- `@supabase/supabase-js`: Supabase 클라이언트 라이브러리

### 개발 의존성
- `@cloudflare/workers-types`: Cloudflare Workers TypeScript 타입
- `wrangler`: Cloudflare Workers CLI 도구

### 기존 Python 의존성 (legacy/)
- `beautifulsoup4`: HTML 파싱
- `requests`: HTTP 요청
- `hanja`: 한자-한글 변환
- `lxml`: XML/HTML 파서

## 🔍 주요 함수

### `src/worker.js`
- `calculateTrends()`: 통합 트렌드 계산
- `getTrendsFromZum()`: Zum 포털 데이터 수집
- `getTrendsFromNate()`: Nate 포털 데이터 수집
- `setDelta()`: 순위 변화 계산
- `processKeyword()`: 키워드 전처리
- `saveTrendsToSupabase()`: Supabase 데이터 저장
- `getPreviousTrends()`: 이전 트렌드 데이터 조회

### 이벤트 핸들러
- `scheduled()`: 크론 작업 핸들러 (10분마다 실행)
- `fetch()`: HTTP 요청 핸들러 (수동 트리거 지원)

## 🚫 제외 키워드

Supabase `exception_keywords` 테이블에 저장된 키워드들은 수집 대상에서 제외됩니다:
- Yesbet88
- sanopk

새로운 제외 키워드는 Supabase 대시보드에서 직접 추가할 수 있습니다.

## 🔧 설정

### 시간 간격 설정
```python
INTERVAL_SECS = 600  # 10분 (600초)
```

### 유사도 가중치
```python
SIMILARITY_WEIGHT = 0.7  # 70%
```

## 📈 API 사용 예시

### Supabase에서 최신 트렌드 조회
```javascript
// 최신 트렌드 상위 10개 조회
const { data: trends } = await supabase
  .from('latest_trends')
  .select('*')
  .order('score', { ascending: false })
  .limit(10);

console.log(trends);
```

### 데이터 형태
```json
[
  {
    "id": 1,
    "timestamp": 1699123456,
    "keyword": "검색어1",
    "score": 40.0,
    "maxscore": 20.0,
    "hashed": "a1b2c3d4e5f6g7h8",
    "delta": -2,
    "rank": 1,
    "engine": "zum",
    "created_at": "2024-01-01T12:00:00Z"
  }
]
```

### 실시간 구독
```javascript
// 트렌드 데이터 실시간 구독
const subscription = supabase
  .channel('trends')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'trend_entries' },
    (payload) => console.log('새로운 트렌드:', payload.new)
  )
  .subscribe();
```

## 🚀 마이그레이션 가이드

기존 Python 버전에서 새로운 Cloudflare Workers + Supabase 아키텍처로 마이그레이션하는 경우:

1. **데이터 마이그레이션**: 기존 JSON 데이터를 Supabase로 이전
2. **GitHub Actions 제거**: `.github/workflows/` 디렉토리 삭제
3. **Python 코드 보관**: `legacy/` 디렉토리로 이동
4. **새로운 환경 설정**: Cloudflare Workers와 Supabase 설정

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해주세요.

## 🔗 관련 링크

- [Cloudflare Workers 문서](https://developers.cloudflare.com/workers/)
- [Supabase 문서](https://supabase.com/docs)
- [Wrangler CLI 문서](https://developers.cloudflare.com/workers/wrangler/)