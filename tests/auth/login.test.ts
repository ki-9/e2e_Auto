import { test, expect } from '@playwright/test';
import { LoginPage, CDMS_LOGIN_CONFIG, RTSM_LOGIN_CONFIG } from '../../pages/common/LoginPage';
import { validateEnvironmentVariables } from '../helpers/test-helpers';
import { verifyLoginSuccess, performLogout } from '../helpers/page-helpers';
import { performLogin } from '../helpers/login-helpers';

// 테스트 시작 전 환경 변수 검증
test.beforeAll(async () => {
  validateEnvironmentVariables();
});

test.describe('Maven 로그인 테스트', () => {

  test('로그인 페이지 접속 테스트', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(RTSM_LOGIN_CONFIG.baseURL, {
        waitUntil: 'networkidle',
        timeout: RTSM_LOGIN_CONFIG.timeout,
      });

      await expect(page).toHaveTitle(/.*Maven.*|.*RTSM.*|.*Clinical.*/i);
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();

    } catch (error) {
      console.error('로그인 페이지 접속 테스트 실패:', error);
      throw error;
    } finally {
      await context.close();
    }
  });

  test('로그인 및 로그아웃 테스트 (전체 플로우)', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      const loginPage = new LoginPage(page, CDMS_LOGIN_CONFIG);

      // === 로그인 단계 ===
      await loginPage.loginWithDeviceKey('owner');
      await verifyLoginSuccess(page);
      await page.waitForTimeout(1000);

      // === 로그아웃 단계 ===
      await performLogout(page);

      // 로그인 페이지로 돌아왔는지 확인
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();

    } catch (error) {
      await page.screenshot({ path: 'login-logout-failure.png', fullPage: true });
      console.log('실패 - 현재 URL:', page.url());
      throw error;
    } finally {
      await context.close();
    }
  });
});