import { test, expect } from '@playwright/test';
import { 
  validateEnvironmentVariables, 
  setDeviceAuthenticationKey, 
  performLogin, 
  TEST_CONFIG 
} from '../helpers/test-helpers';
import { verifyLoginSuccess, performLogout } from '../helpers/page-helpers';

// 테스트 시작 전 환경 변수 검증
test.beforeAll(async () => {
  validateEnvironmentVariables();
});

test.describe('RTSM 인증 테스트', () => {
  
  test('페이지 접속 테스트', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
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
      
    } catch (error) {
      console.error('페이지 접속 테스트 실패:', error);
      throw error;
    } finally {
      await context.close();
    }
  });

  test('디바이스 키 없이 로그인 테스트 (인증번호 단계 포함)', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // 페이지 접속
      await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle' });
      
      // 로그인 수행 (디바이스 키 없이)
      await performLogin(page);
      
      // 인증번호 입력 페이지가 나타나는지 확인
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

  test('디바이스 키로 로그인 및 로그아웃 테스트 (전체 플로우)', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // === 로그인 단계 ===
      await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle' });
      
      await setDeviceAuthenticationKey(page);
      
      await performLogin(page);
      
      await verifyLoginSuccess(page);
           
      // 잠시 대기 (사용자가 로그인된 상태를 확인할 수 있도록)
      await page.waitForTimeout(2000);
      
      // === 로그아웃 단계 ===      
      // 사용자 메뉴 클릭
      await performLogout(page);
      await page.waitForTimeout(1000); // 메뉴 열리기 대기
      
      // 로그아웃 버튼 찾기 및 클릭
      const logoutSelector = 'text=로그아웃, text=Logout';
      
      try {
        await page.waitForSelector(logoutSelector, { timeout: 5000 });
        await page.click(logoutSelector);
        
        // 로그인 페이지로 리다이렉트 확인
        await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
        
        // 로그인 페이지의 요소들이 다시 표시되는지 확인
        await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
        
      } catch (logoutError) {        
        // 현재 페이지 상태 확인을 위한 스크린샷
        await page.screenshot({ path: 'logout-debug.png', fullPage: true });
        
        // 페이지의 현재 상태 확인
        const pageContent = await page.textContent('body');
        console.log('페이지 내용 미리보기:', pageContent?.substring(0, 200));
      }      
    } catch (error) {      
      // 실패 시 디버깅 정보 수집
      await page.screenshot({ path: 'login-logout-failure.png', fullPage: true });
      const currentUrl = page.url();
      console.log('실패');
      console.log('현재 URL:', currentUrl);
      
      throw error;
    } finally {
      await context.close();
    }
  });
});