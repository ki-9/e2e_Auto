# RTSM Maven Clinical 자동화 테스트

Maven Clinical RTSM (Randomization and Trial Supply Management) 시스템의 자동화 테스트 프로젝트입니다.

## 시작하기

### 1. 프로젝트 설치

```bash
# 의존성 설치
npm install

# Playwright 브라우저 설치
npx playwright install
```

### 2. 환경 변수 설정

```bash
# .env.example 파일을 .env로 복사
cp .env.example .env

# .env 파일을 편집하여 실제 값 입력
nano .env
```

#### 환경 변수 설명

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `TEST_BASE_URL` | 테스트 대상 URL | `https://staging.rtsm.mavenclinical.com` |
| `TEST_EMAIL` | 로그인 이메일 | `your-email@example.com` |
| `TEST_PASSWORD` | 로그인 패스워드 | `your-password` |
| `TEST_DEVICE_KEY` | 디바이스 인증 키 | `eyJhbGciOiJIUzUxMi...` |
| `TEST_TIMEOUT` | 테스트 타임아웃 (ms) | `30000` |

## 프로젝트 구조

```
project/
├── .env                          # 환경 변수 (git 제외)
├── .env.example                  # 환경 변수 예시
├── .gitignore                    # Git 무시 파일
├── package.json                  # 프로젝트 설정
├── playwright.config.ts          # Playwright 설정
├── README.md                     # 프로젝트 설명서
├── tests/
│   ├── helpers/                  # 공통 헬퍼 함수들
│   │   ├── test-helpers.ts       # 테스트 유틸리티
│   │   ├── page-helpers.ts       # 페이지 관련 헬퍼
│   │   ├── global-setup.ts       # 전역 설정
│   │   └── global-teardown.ts    # 전역 정리
│   ├── auth/                     # 인증 관련 테스트
│   │   └── login.test.ts         # 로그인/로그아웃 테스트
│   ├── dashboard/                # 대시보드 관련 테스트
│   │   └── study-list.test.ts    # 스터디 목록 테스트
│   └── study/                    # 스터디 관련 테스트
│       └── navigation.test.ts    # 스터디 네비게이션 테스트
└── test-results/                 # 테스트 결과 (자동 생성)
```

## 테스트 케이스

### 인증 테스트 (`tests/auth/`)
- **페이지 접속 테스트**: 기본 URL 접속 및 로그인 폼 확인
- **디바이스 키 없이 로그인**: 일반 로그인 시 인증번호 단계 확인
- **디바이스 키로 로그인 및 로그아웃**: 전체 사용자 여정 검증

### 스터디 테스트 (`tests/study/`)
- **스터디 선택 및 Dashboard 이동**: Protocol No. 링크를 통한 실제 Dashboard 진입
- **스터디 메뉴 네비게이션**: Subject, IP Management, Study Setup 등 메뉴 테스트

## 테스트 실행

### 기본 실행 명령어

```bash
# 모든 테스트 실행
npm run test

# 브라우저 창을 보면서 실행
npm run test:headed

# 순차 실행 (안전함)
npm run test:single

# 병렬 실행 (빠름) 
npm run test:parallel

# 디버그 모드
npm run test:debug

# UI 모드
npm run test:ui

# 테스트 결과 리포트
npm run report
```

### 특정 테스트 실행

```bash
# 인증 테스트만 실행
npx playwright test tests/auth/

# 대시보드 테스트만 실행
npx playwright test tests/dashboard/

# 스터디 테스트만 실행
npx playwright test tests/study/

# 특정 테스트 파일 실행
npx playwright test tests/auth/login.test.ts

# 특정 테스트 케이스 실행
npx playwright test --grep "디바이스 키로 로그인"
```

### 브라우저별 실행

```bash
# Chrome만
npx playwright test --project=chromium

# Firefox만
npx playwright test --project=firefox

# Safari만
npx playwright test --project=webkit
```

## 헬퍼 함수 구조

### `tests/helpers/test-helpers.ts`
- **환경 변수 관리**: `validateEnvironmentVariables()`, `TEST_CONFIG`
- **인증 관련**: `setDeviceAuthenticationKey()`, `performLogin()`
- **팝업 처리**: `handleDuplicateLoginPopup()`

### `tests/helpers/page-helpers.ts`
- **페이지 검증**: `verifyLoginSuccess()`, `verifyDashboardFunctionality()`
- **로딩 대기**: `waitForTableLoading()`

## 주요 기능

### 1. 환경 변수 기반 설정
- 민감한 정보는 `.env` 파일로 분리
- 테스트 시작 전 자동 검증

### 2. 중복 로그인 팝업 자동 처리
- "해당 계정으로 이미 로그인 한 사용자가 있습니다" 팝업 자동 감지
- 다양한 확인 버튼 형태 지원 (Confirm, 확인, OK 등)

### 3. 디바이스 키 기반 2FA 우회
- 인증번호 입력 단계 자동 생략
- 로그인 테스트는 정상 수행하면서 효율성 확보

### 4. React 기반 페이지 구조 지원
- 실제 `<table>` 요소가 아닌 div 기반 테이블 구조 대응
- 동적 로딩 완료 감지

### 5. 실제 워크플로우 테스트
- 스터디 목록 → Protocol No. 클릭 → Dashboard 이동 → Back to Home

## 리포트

테스트 실행 후 다음 형태의 리포트가 생성됩니다:

- **HTML 리포트**: `test-results/` 폴더
- **JSON 결과**: `test-results/results.json`
- **JUnit XML**: `test-results/results.xml`

## 문제 해결

### 환경 변수 오류
```
Error: 필수 환경 변수가 설정되지 않았습니다: TEST_EMAIL, TEST_PASSWORD
```
→ `.env` 파일을 생성하고 필요한 값들을 설정하세요.

### 디바이스 키 만료
```
Error: 인증번호 입력이 필요한 상태입니다
```
→ 새로운 디바이스 키를 브라우저에서 추출하여 업데이트하세요.

#### 디바이스 키 얻는 방법
1. 브라우저에서 수동으로 로그인
2. 개발자 도구 → Application → Cookies
3. `cream:auth:device:key:staging` 쿠키 값 복사
4. `.env` 파일의 `TEST_DEVICE_KEY` 업데이트

### 브라우저 설치 오류
```bash
npx playwright install --force-reinstall
```

### 테스트 실패 디버깅
```bash
# 헤드리스 모드 해제
npm run test:headed

# 디버그 모드로 단계별 실행
npm run test:debug

# 특정 테스트만 디버그
npx playwright test --debug tests/auth/login.test.ts
```

## 향후 확장 계획

### 추가 예정 테스트 모듈
```
tests/
├── subject/                      # 피험자 관리 테스트
│   ├── enrollment.test.ts        # 피험자 등록
│   └── randomization.test.ts     # 무작위배정
├── ip-management/                # IP 관리 테스트
│   ├── delivery.test.ts          # IP 배송
│   ├── inventory.test.ts         # 재고 관리
│   └── accountability.test.ts    # IP 추적
├── study-setup/                  # 스터디 설정 테스트
│   ├── randomization-settings.test.ts
│   └── ip-supply-settings.test.ts
└── user-management/              # 사용자 관리 테스트
    ├── user-roles.test.ts
    └── site-management.test.ts
```

### 성능 테스트
- 로딩 시간 측정
- 대용량 데이터 처리 테스트
- 동시 사용자 시뮬레이션

### API 테스트 통합
- REST API 엔드포인트 테스트
- 데이터 무결성 검증

## 기여하기

1. 환경 변수 설정 후 테스트 실행
2. 새로운 테스트 케이스 추가 시 적절한 폴더에 배치
3. 헬퍼 함수는 `tests/helpers/`에 추가
4. 민감한 정보는 반드시 환경 변수로 관리
5. README 업데이트

## 라이선스

MIT License