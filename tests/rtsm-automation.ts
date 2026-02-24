import { chromium, Browser, Page } from 'playwright';

interface TestResult {
  success: boolean;
  message: string;
  studyListFound: boolean;
  firstStudyName?: string;
  userCount?: number;
  timestamp: string;
}

async function runRTSMTest(): Promise<TestResult> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // 1. Chromium 브라우저 시작
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled'],
    });

    page = await browser.newPage();

    // 2. 웹사이트에 접속
    console.log('🔄 Navigating to https://staging.rtsm.mavenclinical.com/');
    await page.goto('https://staging.rtsm.mavenclinical.com/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 3. 20초 대기
    console.log('⏳ Waiting for 20 seconds...');
    await page.waitForTimeout(20000);

    // 4. Study 리스트가 존재하는지 확인
    console.log('🔍 Checking if Study list exists...');
    
    // Study 링크가 있는지 확인
    const studyLinks = await page.$$eval('a', (links: HTMLAnchorElement[]) => {
      return links
        .filter((link) => link.textContent?.includes('RTSM_JK'))
        .map((link) => ({
          name: link.textContent?.trim() || '',
          href: link.href,
        }));
    });

    if (studyLinks.length === 0) {
      return {
        success: false,
        message: '❌ Study 리스트를 찾을 수 없습니다.',
        studyListFound: false,
        timestamp: new Date().toISOString(),
      };
    }

    console.log(`✅ Study 리스트 발견 (총 ${studyLinks.length}개)`);
    console.log(`📋 첫 번째 Study: ${studyLinks[0].name}`);

    // 5. 첫 번째 Study에 들어가기
    const firstStudyName = studyLinks[0].name;
    const firstStudyUrl = studyLinks[0].href;

    console.log(`🔗 첫 번째 Study로 이동 중: ${firstStudyName}`);
    await page.goto(firstStudyUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 페이지 로드 확인
    await page.waitForSelector('text=Manage User', { timeout: 10000 });

    // 6. Manage User 메뉴로 이동
    console.log('🔄 Manage User 메뉴로 이동 중...');
    const manageUserLink = await page.$('a:has-text("Manage User")');

    if (!manageUserLink) {
      return {
        success: false,
        message: '❌ Manage User 메뉴를 찾을 수 없습니다.',
        studyListFound: true,
        firstStudyName,
        timestamp: new Date().toISOString(),
      };
    }

    await manageUserLink.click();
    await page.waitForTimeout(2000); // 페이지 로드 대기

    // 7. User 수 확인
    console.log('👥 User 수 확인 중...');

    // 테이블 행 개수 확인 (헤더 행 제외)
    const userRows = await page.$$eval(
      'table tbody tr, [role="row"]',
      (rows: HTMLElement[]) => {
        // 실제 데이터 행만 카운트 (헤더나 다른 요소 제외)
        return rows.filter((row) => {
          const text = row.textContent || '';
          // 빈 행이 아니고 User 정보를 포함하는 행만 카운트
          return text.trim().length > 0;
        });
      }
    );

    // 페이지 텍스트에서 User 정보 확인
    const pageText = await page.evaluate(() => document.body.innerText);
    const userMatches = pageText.match(/No\.\s+\d+/g);
    const userCount = userMatches ? userMatches.length : userRows.length;

    console.log(`✅ User 수: ${userCount}명`);

    // 8. 결과 반환
    return {
      success: true,
      message: `✅ 테스트 완료! Study 리스트 확인 및 Manage User에서 ${userCount}명의 User를 찾았습니다.`,
      studyListFound: true,
      firstStudyName,
      userCount,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ 테스트 실패:', errorMessage);

    return {
      success: false,
      message: `❌ 테스트 실패: ${errorMessage}`,
      studyListFound: false,
      timestamp: new Date().toISOString(),
    };
  } finally {
    // 브라우저 종료
    if (browser) {
      await browser.close();
      console.log('🔌 브라우저 종료');
    }
  }
}

// 테스트 실행
(async () => {
  console.log('🚀 Maven RTSM 자동화 테스트 시작\n');
  console.log('=' .repeat(50));

  const result = await runRTSMTest();

  console.log('=' .repeat(50));
  console.log('\n📊 테스트 결과:');
  console.log(`  - 성공 여부: ${result.success ? '✅ 성공' : '❌ 실패'}`);
  console.log(`  - Study 리스트 발견: ${result.studyListFound ? '✅ 예' : '❌ 아니오'}`);
  if (result.firstStudyName) {
    console.log(`  - 첫 번째 Study: ${result.firstStudyName}`);
  }
  if (result.userCount !== undefined) {
    console.log(`  - User 수: ${result.userCount}명`);
  }
  console.log(`  - 메시지: ${result.message}`);
  console.log(`  - 실행 시간: ${result.timestamp}`);
  console.log('=' .repeat(50));

  process.exit(result.success ? 0 : 1);
})();