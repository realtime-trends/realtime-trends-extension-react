# GitHub App 설치 및 설정 가이드

## 1. GitHub App 생성

### Step 1: GitHub에서 App 생성
1. GitHub → Settings → Developer settings → GitHub Apps → **New GitHub App**

### Step 2: 기본 설정
```
App name: realtime-trends-scheduler
Homepage URL: https://github.com/realtime-trends/realtime-trends-extension-react
Description: Automated trend data updates for Chrome extension
```

### Step 3: 권한 설정
**Repository permissions:**
- Actions: **Write** (workflow 트리거용)
- Contents: **Read** (레포 정보 읽기용)

**Account permissions:** 모두 **No access**

### Step 4: 이벤트 설정
- Subscribe to events: **체크 안함**
- Webhook: **Active 체크 해제**

### Step 5: 설치 범위
- Where can this GitHub App be installed?: **Only on this account**

## 2. App 설치 및 설정

### Step 1: Private Key 생성
1. 생성된 App 페이지에서 **Generate a private key** 클릭
2. `.pem` 파일 다운로드 및 안전하게 보관

### Step 2: App ID 확인
- App 페이지에서 **App ID** 복사 (예: 123456)

### Step 3: App 설치
1. App 페이지에서 **Install App** 클릭
2. 대상 레포지토리 선택: `realtime-trends/realtime-trends-extension-react`
3. Repository access: **Selected repositories** 선택

### Step 4: Installation ID 확인
설치 후 URL에서 Installation ID 확인:
```
https://github.com/settings/installations/12345678
                                      ^^^^^^^^
                                   Installation ID
```

## 3. Cloudflare Workers 설정

### Step 1: Secrets 설정
```bash
cd workers

# App ID 설정
wrangler secret put APP_ID
# 입력: 123456

# Private Key 설정 (전체 PEM 내용 복사-붙여넣기)
wrangler secret put PRIVATE_KEY
# 입력: -----BEGIN RSA PRIVATE KEY-----
# MIIEpAIBAAKCAQEA...
# -----END RSA PRIVATE KEY-----

# Installation ID 설정
wrangler secret put INSTALLATION_ID
# 입력: 12345678
```

### Step 2: 배포
```bash
wrangler deploy
```

### Step 3: 테스트
```bash
# 수동 트리거 테스트
curl -X POST https://realtime-trends-scheduler.your-subdomain.workers.dev/trigger

# 로그 확인
wrangler tail
```

## 4. 보안 장점

### GitHub App vs Personal Access Token

| 항목 | GitHub App | Personal Access Token |
|------|------------|----------------------|
| 토큰 수명 | 1시간 (자동 갱신) | 최대 1년 |
| 권한 범위 | 특정 레포 + 세밀한 권한 | 전체 계정 권한 |
| 감사 로그 | 앱별 분리 | 사용자 계정과 혼재 |
| 보안성 | 매우 높음 | 중간 |
| 설정 복잡도 | 높음 | 낮음 |

## 5. 문제 해결

### 일반적인 오류들

**"Bad credentials" 오류:**
- App ID, Private Key, Installation ID 재확인
- Private Key에 `\n`이 올바르게 포함되었는지 확인

**"Not Found" 오류:**
- Repository 이름 확인
- App이 해당 레포에 설치되었는지 확인

**"Forbidden" 오류:**
- App 권한 설정 확인 (Actions: Write)
- Installation이 올바른 레포에 되었는지 확인

## 6. 모니터링

### 로그 확인
```bash
# 실시간 로그
wrangler tail

# 특정 에러만 필터링
wrangler tail | grep ERROR
```

### GitHub에서 확인
- Repository → Settings → Developer settings → GitHub Apps
- 각 API 호출이 로그에 기록됨

이제 GitHub App이 매 5분마다 안전하게 워크플로우를 트리거합니다!