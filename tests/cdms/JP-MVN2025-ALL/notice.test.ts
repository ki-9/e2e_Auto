import { test, Browser, BrowserContext, Page } from '@playwright/test';
import * as path from 'path';
import { LoginPage, CDMS_LOGIN_CONFIG } from '../../../pages/common/LoginPage';
import { StudyListPage } from '../../../pages/cdms/common/StudyListPage';
import { NoticePage } from '../../../pages/cdms/JP-MVN2025-ALL/NoticePage';
import { validateEnvironmentVariables } from '../../helpers/test-helpers';

const STUDY_PROTOCOL_NO = 'JP-MVN2025-ALL_Auto';
const LANG = 'en'; // 'ko' | 'en'
const noticeTitle = 'Test Notice Title';
const noticeContent = 'Test Notice Content';
const changedNoticeTitle = 'Changed Notice Title';
const changedContent = 'Changed Notice Content';

test.beforeAll(async () => {
  validateEnvironmentVariables();
});

test.describe.serial('Study Notice', () => {

  let context: BrowserContext;
  let noticePage: NoticePage;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    const page = await context.newPage();

    const loginPage = new LoginPage(page, CDMS_LOGIN_CONFIG);
    await loginPage.loginWithDeviceKey('owner');

    const studyListPage = new StudyListPage(page, LANG);
    await studyListPage.navigate();
    await studyListPage.selectStudy(STUDY_PROTOCOL_NO);

    noticePage = new NoticePage(page, LANG);
    await noticePage.navigateToNoticeTab();
  });

  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status === 'failed') {
      const page = noticePage.getPage();
      const screenshotPath = `test-results/screenshots/${testInfo.title}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.error(`❌ 실패한 테스트: ${testInfo.title}`);
      console.error(`   실패 원인: ${testInfo.error?.message}`);
      console.error(`   스크린샷: ${screenshotPath}`);
    }
  });

  // 전체 테스트 종료 후 context 정리
  test.afterAll(async () => {
    await context.close();
  });

  test('1. 사용자가 새 공지사항을 작성하면 Notice 목록에 반영되어야 한다', async () => {
    await test.step('Notice 추가 버튼 클릭 및 내용 입력', async () => {
        await noticePage.createNotice(noticeTitle, noticeContent);
    });
    await test.step('Notice 목록 반영 확인', async () => {
        await noticePage.verifyNoticeVisible(noticeTitle);
    });
  });

  test('2. 사용자가 파일을 업로드하면 파일 이름이 화면에 표기된다', async () => {
    await test.step('Notice 상세 진입 및 수정 모드 전환', async () => {
        await noticePage.openNotice(noticeTitle);
    });
    await test.step('파일 업로드', async () => {
        await noticePage.uploadAttachment(
            path.resolve(__dirname, '../../../asset/sample.pdf')
        );
    });
    await test.step('첨부파일명 확인', async () => {
        await noticePage.verifyAttachmentName('sample.pdf');
    });
  });

  test('3. 사용자가 공지사항을 수정하면 해당 Notice Detail 페이지에 반영되어야 한다', async () => {
    await test.step('제목 및 내용 수정', async () => {
        await noticePage.editNotice(changedNoticeTitle, changedContent);
    });
    await test.step('수정된 내용 확인', async () => {
        await noticePage.verifyNoticeVisible(changedNoticeTitle);
    });
  });

  test('4. 사용자가 공지사항을 삭제하면 해당 Notice는 List에서 보이지 않는다', async () => {
    await test.step('Notice 탭 이동 및 삭제', async () => {
        await noticePage.navigateToNoticeTab();
        await noticePage.deleteNotice(changedNoticeTitle);
    });
    await test.step('삭제된 Notice 미노출 확인', async () => {
        await noticePage.verifyNoticeNotVisible(changedNoticeTitle);
    });
  });
});