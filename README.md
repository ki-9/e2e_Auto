# Maven Clinical E2E 자동화 테스트

Maven Clinical의 **RTSM**과 **CDMS** 제품에 대한 End-to-End 자동화 테스트 프로젝트입니다.

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| 테스트 프레임워크 | Playwright |
| 언어 | TypeScript |
| 아키텍처 | Page Object Model (POM) |
| 환경 변수 관리 | dotenv |

---

## 프로젝트 구조

```
project/
├── .env                                  # 환경 변수 (git 제외)
├── .env.example                          # 환경 변수 예시
├── .gitignore
├── package.json
├── playwright.config.ts                  # Playwright 설정 (제품별 project 분리)
├── README.md
│
├── pages/                                # Page Object Model
│   ├── common/
│   │   ├── LoginPage.ts                  # 로그인 config 및 LoginPage 클래스
│   │   └── LanguageConfig.ts             # 언어별 텍스트 매핑 (ko/en)
│   ├── rtsm/                             # RTSM 전용 페이지 객체
│   └── cdms/
│       ├── common/
│       │   ├── BaseCDMSPage.ts           # CDMS 공통 동작 (언어 처리 포함)
│       │   └── StudyListPage.ts          # 스터디 목록 및 선택
│       └── studies/
│           ├── StudyA/
│           │   ├── eCRF/
│           │   │   ├── VisitPage.ts
│           │   │   └── AEPage.ts
│           │   └── QueryPage.ts
│           └── StudyB/
│               └── eCRF/
│                   └── VisitPage.ts
│
└── tests/
    ├── helpers/
    │   ├── login-helpers.ts              # 로그인 관련 공통 함수
    │   ├── test-helpers.ts               # 환경 변수 검증
    │   ├── page-helpers.ts               # 페이지 조작 관련 함수
    │   ├── global-setup.ts               # 전역 설정
    │   └── global-teardown.ts            # 전역 정리
    ├── rtsm/
    │   └── auth/
    │       └── login.test.ts             # RTSM 로그인 테스트
    └── cdms/
        ├── StudyA/
        │   ├── ecrf.test.ts
        │   └── query.test.ts
        └── StudyB/
            └── ecrf.test.ts
```

---

## 아키텍처 설계

### 1. 로그인 Config 구조 (`pages/common/LoginPage.ts`)

로그인에 필요한 설정을 3가지 레벨로 분리합니다.

```
AccountCredentials (계정 레벨)
└── email, password

CommonLoginConfig (공통 레벨)
└── timeout, accounts: { [role]: AccountCredentials }

LoginConfig (제품 레벨)
└── baseURL + CommonLoginConfig 상속
```

RTSM과 CDMS는 `baseURL`만 다르고 로그인 구조가 동일하므로, 공통 설정을 분리하여 중복을 제거합니다.

```typescript
// 공통 설정 (한 곳에서 관리)
const COMMON_CONFIG: CommonLoginConfig = {
  timeout: 30000,
  accounts: {
    admin: { email: '...', password: '...' },
    site:  { email: '...', password: '...' },
  },
};

// 제품별 config는 baseURL만 추가
export const RTSM_LOGIN_CONFIG: LoginConfig = {
  ...COMMON_CONFIG,
  baseURL: 'https://staging.rtsm.mavenclinical.com',
};

export const CDMS_LOGIN_CONFIG: LoginConfig = {
  ...COMMON_CONFIG,
  baseURL: 'https://staging-sbx.cdms.mavenclinical.com',
};
```

### 2. 파일별 역할 분리

| 파일 | 역할 |
|------|------|
| `LoginPage.ts` | config 타입 정의, 제품별 config 상수, `LoginPage` 클래스 |
| `login-helpers.ts` | `performLogin`, `handleDuplicateLoginPopup`, `handleVersionReleasePopup` |
| `test-helpers.ts` | `validateEnvironmentVariables` |
| `page-helpers.ts` | `verifyLoginSuccess`, `performLogout` 등 페이지 조작 함수 |

### 3. 파일 간 참조 방향 (단방향 유지)

```
LoginPage.ts          (외부 의존 없음)
      ↑
login-helpers.ts      (AccountCredentials import)
      ↑
test-helpers.ts       (login-helpers re-export 없음, validateEnvironmentVariables만 보유)
      ↑
login.test.ts         (각 파일에서 직접 import)
```

순환 참조(Circular Dependency)가 발생하지 않도록 참조는 항상 단방향으로 유지합니다.

### 4. CDMS 페이지 객체 상속 구조

```
BaseCDMSPage          (언어 처리된 공통 버튼 동작)
      ↑
VisitPage, AEPage      (스터디/페이지별 입력 필드 및 검증 로직)
```

언어 설정(`ko` / `en`)은 테스트 파일에서 지정하며, `BaseCDMSPage`를 통해 하위 페이지 객체에 자동으로 적용됩니다.

---

## 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성합니다.

```bash
cp .env.example .env
```

### 환경 변수 목록

```bash
# 공통
TEST_TIMEOUT=30000

# 계정별 (제품 구분 없이 role로만 구분)
TEST_EMAIL_ADMIN=admin@example.com
TEST_PASSWORD_ADMIN=...

TEST_EMAIL_SITE=owner@example.com
TEST_PASSWORD_SITE=...
```

---

## 주요 기능

### 중복 로그인 팝업 처리 (`handleDuplicateLoginPopup`)
동일 계정으로 이미 로그인된 세션이 있을 경우 나타나는 팝업을 자동으로 감지하고 확인 버튼을 클릭합니다.

### Version & Release 팝업 처리 (`handleVersionReleasePopup`)
로그인 후 공지사항 팝업이 0개, 1개, 2개 연속으로 나타나는 모든 케이스를 `while` 루프로 처리합니다.

```typescript
while (true) {
  const popupVisible = await page
    .locator('[role="dialog"] [class="GrButton-content"]')
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (!popupVisible) break;  // 팝업 없으면 종료

  await btn.click();         // 팝업 닫기
  closedCount++;
}
```

### 언어 지원 (`LanguageConfig.ts`)
한국어/영어 UI에 모두 대응합니다. 테스트 파일에서 언어를 지정하면 하위 페이지 객체에 자동 적용됩니다.

```typescript
const LANG = 'ko'; // 'ko' | 'en'
const visitPage = new VisitPage(page, LANG);
await visitPage.submitForm(); // 언어에 맞는 버튼 자동 클릭
```

### 역할(Role)별 계정 관리
동일한 로그인 흐름에서 역할만 변경하여 다양한 계정으로 테스트할 수 있습니다.

```typescript
await loginPage.login('admin');
await loginPage.login('owner');
```

---

## 테스트 실행

```bash
# 전체 테스트
npx playwright test

# 제품별 실행
npx playwright test --project=rtsm-chromium
npx playwright test --project=cdms-chromium

# 특정 테스트 파일 실행
npx playwright test tests/rtsm/auth/login.test.ts

# 헤드리스 모드 해제
npx playwright test --headed

# 디버그 모드
npx playwright test --debug

# 테스트 결과 리포트
npx playwright show-report
```

---

## 테스트 대상 URL

| 제품 | URL |
|------|-----|
| RTSM | https://staging.rtsm.mavenclinical.com |
| CDMS | https://staging-sbx.cdms.mavenclinical.com |

---

## 테스트 리포트

테스트 실행 후 `test-results/` 폴더에 아래 형식으로 결과가 생성됩니다.

| 형식 | 경로 |
|------|------|
| HTML | `playwright-report/` |
| JSON | `test-results/results.json` |
| JUnit XML | `test-results/results.xml` |
