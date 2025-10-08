# Security Best Practices for API Keys

## 1. Fine-grained Personal Access Token (Recommended)

GitHub의 새로운 fine-grained token을 사용하면 특정 레포지토리에만 권한을 제한할 수 있습니다:

### 생성 방법:
1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Repository access: "Selected repositories" → 이 레포만 선택
3. Repository permissions:
   - Actions: Write (workflow 트리거용)
   - Contents: Read (레포 정보 읽기용)
   - Pull requests: Write (선택사항)

### 장점:
- 특정 레포지토리에만 권한 제한
- 더 세밀한 권한 제어
- 만료일 설정 가능 (최대 1년)

## 2. GitHub App (가장 안전)

### 생성 방법:
1. GitHub → Settings → Developer settings → GitHub Apps → New GitHub App
2. Repository permissions:
   - Actions: Write
   - Contents: Read
3. Install app on your repository

### 장점:
- 짧은 수명의 토큰 (1시간)
- 더 세밀한 권한 제어
- 감사 로그 개선
- 레이트 리밋 개선

## 3. Token 순환 (Rotation)

### 자동 순환 설정:
```javascript
// 매월 토큰 갱신 알림
const TOKEN_CREATED = '2024-10-08';
const TOKEN_EXPIRES = '2025-10-08';

if (shouldRotateToken()) {
  console.warn('Token expires soon, please rotate');
}
```

## 4. 환경별 분리

### Development vs Production:
- Development: 제한된 권한의 별도 토큰
- Production: 필요 최소 권한만 부여

## 5. 모니터링

### 토큰 사용 모니터링:
- GitHub Audit Log 확인
- 비정상적인 API 호출 감지
- 실패한 인증 시도 알림

## 권장 설정

### wrangler.toml:
```toml
[vars]
TOKEN_TYPE = "fine-grained"  # or "github-app"
TOKEN_EXPIRES = "2025-10-08"

# Secrets:
# GITHUB_TOKEN (fine-grained PAT)
# or
# APP_ID, PRIVATE_KEY, INSTALLATION_ID (GitHub App)
```

### 보안 체크리스트:
- [ ] Fine-grained token 사용
- [ ] 최소 권한 원칙 적용
- [ ] 토큰 만료일 설정
- [ ] 정기적인 토큰 순환
- [ ] 모니터링 설정
- [ ] 개발/운영 환경 분리