import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* 병렬 실행 설정 */
  fullyParallel: true,
  /* CI에서 실패 시 재시도 */
  retries: process.env.CI ? 2 : 0,
  /* 병렬 워커 수 */
  workers: process.env.WORKERS ? parseInt(process.env.WORKERS) : 1,
  /* 리포터 설정 */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* 전역 테스트 설정 */
  use: {
    /* 베이스 URL */
    baseURL: 'https://staging.rtsm.mavenclinical.com',
    
    /* 실패 시 스크린샷 및 비디오 수집 */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    /* 추적 수집 (디버깅용) */
    trace: 'on-first-retry',
    
    /* 타임아웃 설정 */
    actionTimeout: 30000,
    navigationTimeout: 30000,
    
    /* 뷰포트 설정 */
    viewport: { width: 1280, height: 720 },
    
    /* 무시할 HTTPS 에러 */
    ignoreHTTPSErrors: true,
    
    /* 사용자 에이전트 */
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PlaywrightTest'
  },

  /* 프로젝트별 브라우저 설정 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* 모바일 테스트 (필요시 주석 해제) */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Microsoft Edge (필요시 주석 해제) */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },

    /* Google Chrome (필요시 주석 해제) */
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* 로컬 개발 서버 실행 (필요시 설정) */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },

  /* 테스트 출력 디렉토리 */
  outputDir: 'test-results/',
  
  /* 글로벌 설정 */
  globalSetup: require.resolve('./tests/helpers/global-setup.ts'),
  globalTeardown: require.resolve('./tests/helpers/global-teardown.ts'),
  
  /* 테스트 타임아웃 */
  timeout: 60000,
  
  /* expect 타임아웃 */
  expect: {
    timeout: 10000
  }
});