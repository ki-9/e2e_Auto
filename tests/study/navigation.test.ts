import { test, expect } from '@playwright/test';
import { 
  validateEnvironmentVariables, 
  setDeviceAuthenticationKey, 
  performLogin,
  handleVersionReleasePopup, 
  TEST_CONFIG 
} from '../helpers/test-helpers';
import { waitForTableLoading, verifyLoginSuccess } from '../helpers/page-helpers';

// 테스트 시작 전 환경 변수 검증
test.beforeAll(async () => {
  validateEnvironmentVariables();
});

test.describe('RTSM 스터디 네비게이션 테스트', () => {

  test('스터디 선택 및 Dashboard 이동 테스트', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // 페이지 접속
      await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle' });
      
      // 디바이스 인증 키 설정 및 로그인
      await setDeviceAuthenticationKey(page);
      await performLogin(page);
      await verifyLoginSuccess(page);

      // Version & Release 팝업 창 닫기
      await handleVersionReleasePopup(page);
      
      // 스터디 목록 로딩 대기
      await waitForTableLoading(page);
      
      // Protocol No. 열의 링크 클릭 (실제 Dashboard로 이동)
      console.log('📋 Protocol No. 링크를 클릭하여 스터디 Dashboard로 이동 시도...');
      
      const protocolLink = page.locator('a:has-text("RTSM_JK_MVN")').first();
      await expect(protocolLink).toBeVisible();
      
      const linkText = await protocolLink.textContent();
      console.log(`🔗 클릭할 Protocol 링크: ${linkText}`);
      
      // Protocol 링크 클릭
      await protocolLink.click();
      
      // Dashboard 페이지 로딩 대기
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Dashboard 로딩 대기
      
      console.log('✅ 스터디 Dashboard로 이동 완료');
      
      // Dashboard 메뉴들 확인
      const dashboardMenus = [
        'Subject',
        'IP Management', 
        'Study Setup',
        'Manage User',
        'Dashboard'
      ];
      
      let foundMenus = 0;
      for (const menu of dashboardMenus) {
        const isVisible = await page.locator(`text=${menu}`).isVisible().catch(() => false);
        if (isVisible) {
          console.log(`📋 Dashboard 메뉴 확인: ${menu}`);
          foundMenus++;
        }
      }
      
      console.log(`✅ Dashboard 메뉴 ${foundMenus}개 확인됨`);
      
      // IP Management 서브메뉴들 확인
      const ipMenus = ['IP Delivery', 'IP Inventory Management', 'IP Accountability'];
      let foundIpMenus = 0;
      
      for (const ipMenu of ipMenus) {
        const isVisible = await page.locator(`text=${ipMenu}`).isVisible().catch(() => false);
        if (isVisible) {
          console.log(`📦 IP Management 서브메뉴: ${ipMenu}`);
          foundIpMenus++;
        }
      }
      
      // Study Setup 서브메뉴들 확인
      const setupMenus = ['Randomization Settings', 'IP Supply Settings'];
      let foundSetupMenus = 0;
      
      for (const setupMenu of setupMenus) {
        const isVisible = await page.locator(`text=${setupMenu}`).isVisible().catch(() => false);
        if (isVisible) {
          console.log(`⚙️ Study Setup 서브메뉴: ${setupMenu}`);
          foundSetupMenus++;
        }
      }
      
      // Manage 서브메뉴들 확인
      const manageMenus = ['Manage User', 'Manage Role', 'Manage Site', 'Manage Depot'];
      let foundManageMenus = 0;
      
      for (const manageMenu of manageMenus) {
        const isVisible = await page.locator(`text=${manageMenu}`).isVisible().catch(() => false);
        if (isVisible) {
          console.log(`👥 Manage 서브메뉴: ${manageMenu}`);
          foundManageMenus++;
        }
      }
      
      // Back to Home 링크 확인
      await expect(page.locator('text=Back to Home')).toBeVisible();
      console.log('🏠 "Back to Home" 링크 확인됨');
      
      console.log('✅ 스터디 Dashboard 기능 테스트 완료');
      console.log(`📊 총 확인된 메뉴: Dashboard(${foundMenus}), IP(${foundIpMenus}), Setup(${foundSetupMenus}), Manage(${foundManageMenus})`);
      
      // Dashboard에서 다시 홈으로 돌아가기 테스트
      console.log('🔄 "Back to Home" 클릭하여 스터디 목록으로 돌아가기...');
      await page.click('text=Back to Home');
      
      // 스터디 목록 페이지로 돌아왔는지 확인
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=View and select a study from your authorized list')).toBeVisible();
      console.log('✅ 스터디 목록 페이지로 성공적으로 돌아옴');
      
    } catch (error) {
      console.error('스터디 Dashboard 테스트 실패:', error);
      throw error;
    } finally {
      await context.close();
    }
  });

  test('스터디 메뉴 네비게이션 테스트', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // 로그인 및 스터디 Dashboard로 이동
      await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle' });
      await setDeviceAuthenticationKey(page);
      await performLogin(page);
      await verifyLoginSuccess(page);
      await waitForTableLoading(page);
      
      // 스터디 Dashboard로 이동
      const protocolLink = page.locator('a:has-text("RTSM_JK_MVN")').first();
      await protocolLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Subject 메뉴 클릭 테스트
      const subjectMenu = page.locator('text=Subject');
      if (await subjectMenu.isVisible()) {
        console.log('📋 Subject 메뉴 클릭 테스트...');
        await subjectMenu.click();
        await page.waitForTimeout(2000);
        console.log('✅ Subject 메뉴 클릭 완료');
      }
      
      // IP Management 메뉴 확장 테스트
      const ipManagementMenu = page.locator('text=IP Management');
      if (await ipManagementMenu.isVisible()) {
        console.log('📦 IP Management 메뉴 확장 테스트...');
        await ipManagementMenu.click();
        await page.waitForTimeout(1000);
        
        // 서브메뉴 확인
        const ipDelivery = page.locator('text=IP Delivery');
        if (await ipDelivery.isVisible()) {
          console.log('📦 IP Delivery 서브메뉴 클릭 테스트...');
          await ipDelivery.click();
          await page.waitForTimeout(2000);
          console.log('✅ IP Delivery 클릭 완료');
        }
      }
      
      // Study Setup 메뉴 테스트
      const studySetupMenu = page.locator('text=Study Setup');
      if (await studySetupMenu.isVisible()) {
        console.log('⚙️ Study Setup 메뉴 테스트...');
        await studySetupMenu.click();
        await page.waitForTimeout(1000);
        
        // Randomization Settings 서브메뉴 테스트
        const randomizationSettings = page.locator('text=Randomization Settings');
        if (await randomizationSettings.isVisible()) {
          console.log('🎲 Randomization Settings 클릭 테스트...');
          await randomizationSettings.click();
          await page.waitForTimeout(2000);
          console.log('✅ Randomization Settings 클릭 완료');
        }
      }
      
      // Manage User 메뉴 테스트
      const manageUserMenu = page.locator('text=Manage User');
      if (await manageUserMenu.isVisible()) {
        console.log('👥 Manage User 메뉴 클릭 테스트...');
        await manageUserMenu.click();
        await page.waitForTimeout(2000);
        console.log('✅ Manage User 클릭 완료');
      }
      
      console.log('✅ 스터디 메뉴 네비게이션 테스트 완료');
      
    } catch (error) {
      console.error('스터디 메뉴 네비게이션 테스트 실패:', error);
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