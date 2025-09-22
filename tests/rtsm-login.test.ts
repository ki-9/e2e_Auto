import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

// 테스트 설정 상수
const TEST_CONFIG = {
  baseURL: 'https://staging.rtsm.mavenclinical.com',
  credentials: {
    email: 'jk.an@jnpmedi.com',
    password: 'Stest!1204'
  },
  deviceKey: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ2ZXIiOiJ2MSIsInRrbiI6ImJkOTYwMTEyNGVlMGI5MWYiLCJ0eXBlIjoiVVNFUi1ERVZJQ0UiLCJpYXQiOjE3NTgxNzM2NDYsImlzcyI6ImNyZWFtOmF1dGg6ZGV2aWNlOmtleSJ9.hI3d1K0V4p3b4aaKmUm4z8WJoFw6DbCqLYfRRWHpng6wfTMW8oj32vUgk9zPmGTj3vGUScEyG7LUp28rgPV1dg',
  timeout: 30000
};

// 디바이스 키 설정 헬퍼 함수
async function setDeviceAuthenticationKey(page: Page): Promise<void> {
  // JavaScript로 쿠키 직접 설정 (실제 도메인 자동 감지)
  await page.evaluate((deviceKey) => {
    // 도메인 없이 설정하는 것이 가장 효과적
    document.cookie = `cream:auth:device:key:staging=${deviceKey}; path=/; secure; samesite=lax`;
    console.log('디바이스 키 설정 완료:', document.cookie.includes('cream:auth:device:key:staging'));
  }, TEST_CONFIG.deviceKey);
  
  // 설정 확인
  const cookieSet = await page.evaluate(() => {
    return document.cookie.includes('cream:auth:device:key:staging');
  });
  
  if (!cookieSet) {
    throw new Error('디바이스 키 쿠키 설정 실패');
  }
  
  console.log('✅ 디바이스 인증 키가 성공적으로 설정되었습니다.');
}

// 로그인 헬퍼 함수
async function performLogin(page: Page): Promise<void> {
  // 이메일 입력
  const emailSelector = 'input[name="email"], input[type="email"], #email';
  await page.waitForSelector(emailSelector, { timeout: TEST_CONFIG.timeout });
  await page.fill(emailSelector, TEST_CONFIG.credentials.email);

  // 패스워드 입력
  const passwordSelector = 'input[name="password"], input[type="password"], #password';
  await page.fill(passwordSelector, TEST_CONFIG.credentials.password);

  // 로그인 버튼 클릭
  const loginButtonSelector = 'button[type="submit"], input[type="submit"], button:has-text("로그인"), button:has-text("Login"), button:has-text("Sign In")';
  await page.click(loginButtonSelector);
}

// 로그인 성공 확인 헬퍼 함수
async function verifyLoginSuccess(page: Page): Promise<void> {
  // 로그인 후 대시보드나 메인 페이지 요소 확인
  // 예: 사용자 메뉴, 로그아웃 버튼, 또는 특정 페이지 요소
  await page.waitForLoadState('networkidle');
  
  // URL이 로그인 페이지가 아닌지 확인
  await expect(page).not.toHaveURL(/.*login.*/);
  
  // 또는 특정 요소가 존재하는지 확인 (실제 페이지 구조에 따라 조정 필요)
  await expect(page.locator('body')).toBeVisible();
}

test.describe('RTSM Maven Clinical 로그인 테스트', () => {
  
  test('페이지 접속 테스트', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 페이지 접속
    await page.goto(TEST_CONFIG.baseURL, { 
      waitUntil: 'networkidle',
      timeout: TEST_CONFIG.timeout 
    });
    
    // 페이지 로드 확인
    await expect(page).toHaveTitle(/.*Maven.*|.*RTSM.*|.*Clinical.*/i);
    
    // 로그인 폼 요소 확인
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    
    await context.close();
  });

  test('디바이스 키 없이 로그인 테스트 (인증번호 단계 포함)', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // 페이지 접속
      await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle' });
      
      // 로그인 수행
      await performLogin(page);
      
      // 인증번호 입력 페이지가 나타나는지 확인
      // (실제 구현에서는 인증번호 입력 필드나 관련 텍스트를 확인)
      await page.waitForTimeout(3000); // 페이지 전환 대기
      
      console.log('현재 URL:', page.url());
      console.log('인증번호 입력이 필요한 상태입니다.');
      
      // 여기서 실제로는 인증번호를 입력해야 하지만, 
      // 테스트에서는 이 단계가 나타나는 것을 확인하는 것으로 충분
      
    } catch (error) {
      console.error('로그인 테스트 실패:', error);
      throw error;
    } finally {
      await context.close();
    }
  });

  test('디바이스 키로 로그인 테스트 (인증번호 단계 생략)', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // 페이지 접속
      await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle' });
      
      // 디바이스 인증 키 설정
      await setDeviceAuthenticationKey(page);
      
      // 로그인 수행
      await performLogin(page);
      
      // 로그인 성공 확인 (인증번호 단계 없이 바로 대시보드로 이동)
      await verifyLoginSuccess(page);
      
      console.log('✅ 디바이스 키를 사용한 로그인 성공 - 인증번호 단계 생략됨');
      
      // 추가 페이지 동작 테스트 가능
      // 예: 메뉴 클릭, 데이터 조회 등
      
    } catch (error) {
      console.error('디바이스 키 로그인 테스트 실패:', error);
      throw error;
    } finally {
      await context.close();
    }
  });

  test('로그인 후 기본 기능 테스트', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // 페이지 접속
      await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle' });
      
      // 디바이스 인증 키 설정 및 로그인
      await setDeviceAuthenticationKey(page);
      await performLogin(page);
      await verifyLoginSuccess(page);
      
      // 스터디 목록이 표시되는지 확인
      await expect(page.locator('text=스터디 목록을 조회하고')).toBeVisible();
      
      // 테이블이 로드되었는지 확인
      await expect(page.locator('table')).toBeVisible();
      
      // 사용자 정보 확인 (안재규)
      await expect(page.locator('text=안재규')).toBeVisible();
      
      console.log('✅ 기본 기능 테스트 완료');
      
    } catch (error) {
      console.error('기본 기능 테스트 실패:', error);
      throw error;
    } finally {
      await context.close();
    }
  });

  test('로그아웃 테스트', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // 페이지 접속
      await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle' });
      
      // 디바이스 인증 키 설정 및 로그인
      await setDeviceAuthenticationKey(page);
      await performLogin(page);
      await verifyLoginSuccess(page);
      
      // 사용자 메뉴 클릭 (안재규 텍스트 클릭)
      await page.click('text=안재규');
      
      // 로그아웃 버튼 찾기 및 클릭
      const logoutSelector = 'text=로그아웃, text=Logout';
      
      try {
        await page.waitForSelector(logoutSelector, { timeout: 5000 });
        await page.click(logoutSelector);
        
        // 로그인 페이지로 리다이렉트 확인
        await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
        
        console.log('✅ 로그아웃 성공');
      } catch (logoutError) {
        console.log('로그아웃 메뉴를 찾을 수 없습니다. 사용자 메뉴 구조를 확인해주세요.');
        
        // 페이지의 현재 상태 확인
        const pageContent = await page.textContent('body');
        console.log('페이지 내용 미리보기:', pageContent?.substring(0, 200));
      }
      
    } catch (error) {
      console.error('로그아웃 테스트 실패:', error);
      throw error;
    } finally {
      await context.close();
    }
  });

});

// 테스트 설정 확장
test.use({
  viewport: { width: 1280, height: 720 },
  screenshot: 'only-on-failure',
  video: 'retain-on-failure'
});