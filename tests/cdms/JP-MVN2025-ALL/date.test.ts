// tests/cdms/MVN2025-ALL/date.test.ts
import { test, expect, BrowserContext } from '@playwright/test';
import dayjs from 'dayjs';
import { LoginPage, CDMS_LOGIN_CONFIG } from '../../../pages/common/LoginPage';
import { StudyListPage } from '../../../pages/cdms/common/StudyListPage';
import { SubjectListPage } from '../../../pages/cdms/common/SubjectListPage';
import { DatePage } from '../../../pages/cdms/JP-MVN2025-ALL/DatePage';
import { validateEnvironmentVariables } from '../../helpers/test-helpers';

const LANG = 'en';
const STUDY_PROTOCOL_NO = 'JP-MVN2025-ALL_Auto';
const VISIT_1 = 'Visit 1';
const VISIT_5 = 'Visit 5';
const SV_PAGE_NAME = '방문일';
const SV_PAGE_VISITDATE_LABEL = '방문일';
const IE_PAGE_NAME = '선정/제외기준 확인';
const IE_SINGLE_SELECT_LABEL = '3. 다음과 같은 검사 수치를 모두 나타내거나, 복수, 황달, 간성뇌증, 정맥류 출혈 등이 있는 비대상성 간질환(Decompensated liver disease) 환자';
const IE_CONFIRM_MESSAGE_TEXT = '비대상성 간질환';
const DATE_PAGE_NAME = 'Date Item';
const DATE_PAGE_DATEDATEUK_LABEL = 'Day UK';
const DATE_PAGE_DATEMONTHUK_LABEL = 'Month UK';
const DATE_PAGE_DATEYEARUK_LABEL = 'All UK';

const randomDate = dayjs()
  .subtract(Math.floor(Math.random() * 365), 'day');

test.beforeAll(async () => {
  validateEnvironmentVariables();
});

test.describe('[EDC] Date Item > format : DD-MMM-YYYY', () => {

  let context: BrowserContext;
  let datePage: DatePage;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    const page = await context.newPage();

    // 로그인
    const loginPage = new LoginPage(page, CDMS_LOGIN_CONFIG);
    await loginPage.loginWithDeviceKey('owner');

    // 스터디 진입
    const studyListPage = new StudyListPage(page, LANG);
    await studyListPage.navigate();
    await studyListPage.selectStudy(STUDY_PROTOCOL_NO);

    // Subject 진입
    const subjectListPage = new SubjectListPage(page, LANG);
    await subjectListPage.navigate();
    await subjectListPage.selectFirstSubject();

    datePage = new DatePage(page, LANG);
  });

  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status === 'failed') {
      const page = datePage.getPage();
      const screenshotPath = `test-results/screenshots/${testInfo.title}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.error(`❌ 실패한 테스트: ${testInfo.title}`);
      console.error(`   실패 원인: ${testInfo.error?.message}`);
      console.error(`   스크린샷: ${screenshotPath}`);
    }
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe.serial('[EDC] IE Data Capture Test', () => {

    test('사용자가 SV 페이지를 저장하면 IE 페이지가 활성화된다', async () => {
      await test.step('SV CRF 페이지로 이동', async () => {
        await datePage.scrollToVisit(VISIT_1);
        await datePage.goToCrfPage(VISIT_1, SV_PAGE_NAME);
      });
      await test.step('날짜 입력 및 저장', async () => {
        await datePage.setItemDateField(SV_PAGE_VISITDATE_LABEL, 4);
        await datePage.clickSave();
      });
      await test.step('IE 페이지 활성화 확인', async () => {
        await datePage.waitForIEPageActive(IE_PAGE_NAME);
        const iePageLinkLocator = datePage.getPage()
          .getByRole('link', { name: IE_PAGE_NAME });

        const isIePageActive = await iePageLinkLocator.evaluate(
          el => !el.querySelector('.cr-nav-wrapped')?.classList.contains('--is-not-available')
        );

        expect(isIePageActive).toBe(true);  
      });
    });


    test('사용자가 confirmMessage[ADD]가 설정된 아이템을 최초 저장하려고 할 때, 확인 메시지(Dialog)가 보인다', async () => {
      await test.step('IE 페이지 이동 및 항목 선택', async () => {
        await datePage.goToCrfPage(VISIT_1, IE_PAGE_NAME);
        await datePage.setItemSingleSelectRadio(IE_SINGLE_SELECT_LABEL, '예');
      });
      await test.step('페이지 저장 후 Confirm Message Dialog 표시 확인', async () => {
        await datePage.clickConfirmSave();
        await datePage.verifyDialogVisible(IE_CONFIRM_MESSAGE_TEXT);
        await datePage.clickConfirm();
      });
    });

    test('사용자가 confirmMessage[MODIFY]가 설정된 아이템을 수정하려고 할 때, 확인 메시지(Dialog)가 보인다', async () => {
      await test.step('항목 수정하고 페이지 저장 후 Confirm Message Dialog 표시 확인', async () => {
        await datePage.setItemSingleSelectRadio(IE_SINGLE_SELECT_LABEL, '아니오');
        await datePage.clickConfirmModifySaveButton('New Data');
        await datePage.verifyDialogVisible(IE_CONFIRM_MESSAGE_TEXT);
        await datePage.clickConfirm();
      });
    });

    test('저장된 IE 페이지에서 미입력 Field에 Auto Query가 보인다', async () => {
      await test.step('Auto Query 21개 Open 검증', async () => {
        await datePage.verifyAutoQueryOnEmptyFields(21);
      });
    });
  });

  test.describe.serial('[EDC] Date Item UK Format Capture Test', () => {

    test('Day UK 입력 저장 시 Audit에서 UK-MMM-YYYY 포맷으로 기록된다', async () => {
      await test.step('Date Item CRF 페이지로 이동', async () => {
        await datePage.scrollToVisit(VISIT_5);
        await datePage.goToCrfPage(VISIT_5, DATE_PAGE_NAME);
        await datePage.activateCrf();
      });
      
      const dateUKVal = `UK-${randomDate.format('MMM-YYYY')}`;

      await test.step('Day UK 값 입력 및 저장', async () => {
        await datePage.fillDateTextField(DATE_PAGE_DATEDATEUK_LABEL, dateUKVal);
        await datePage.clickSave();
      });
      await test.step('Audit에서 UK-MMM-YYYY 포맷 확인', async () => {
        await datePage.openAuditTrail(DATE_PAGE_DATEDATEUK_LABEL);
        await datePage.verifyFirstAuditContains(dateUKVal);
      });
    });

    test('Month UK 입력 저장 시 Audit에서 DD-UNK-YYYY 포맷으로 기록된다', async () => {
      const monthUKVal = `${randomDate.format('DD')}-UNK-${randomDate.year()}`;

      await test.step('Month UK 값 입력 및 수정 저장', async () => {
        await datePage.fillDateTextField(DATE_PAGE_DATEMONTHUK_LABEL, monthUKVal);
        await datePage.clickModifySaveButton('New Data');
      });
      await test.step('Audit에서 DD-UNK-YYYY 포맷 확인', async () => {
        await datePage.openAuditTrail(DATE_PAGE_DATEMONTHUK_LABEL);
        await datePage.verifyAuditContains(monthUKVal);
      });
    });

    test('모든 UK 입력 저장 시 Audit에서 UK-UNK-UKUK으로 기록된다', async () => {
      const yearUkVal = 'UK-UNK-UKUK';

      await test.step('Year UK 값 입력 및 수정 저장', async () => {
        await datePage.fillDateTextField(DATE_PAGE_DATEYEARUK_LABEL, yearUkVal);
        await datePage.clickModifySaveButton('New Data');
      });
      await test.step('Audit에서 UK-UNK-UKUK 확인', async () => {
        await datePage.openAuditTrail(DATE_PAGE_DATEYEARUK_LABEL);
        await datePage.verifyAuditDataContains(yearUkVal);
      });
    });
  });
});