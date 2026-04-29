import { test, expect, BrowserContext } from '@playwright/test';
import { LoginPage, CDMS_LOGIN_CONFIG } from '../../../pages/common/LoginPage';
import { StudyListPage } from '../../../pages/cdms/common/StudyListPage';
import { SubjectListPage } from '../../../pages/cdms/common/SubjectListPage';
import { ESignPage } from '../../../pages/cdms/JP-MVN2025-ALL/ESignPage';
import { validateEnvironmentVariables } from '../../helpers/test-helpers';

const LANG = 'ko';
const STUDY_PROTOCOL_NO = 'JP-MVN2025-ALL_Auto';

const ALL_VISIT = 'All Visit';
const DS_PAGE_NAME = '임상시험 종료';
const DS_ITEM_DSREAS_LABEL = '상태';
const DS_ITEM_DSREAS_ITEM_CODE_LABEL = '스크리닝 탈락';

const SECOND_ESIGN = 'Second E-Sign';
const CANCEL_SECOND_ESIGN = 'Cancel Second E-Sign';
const ESIGN_REASON = 'Second E-Sign Test';
const ESIGN_CANCELLATION_REASON = 'Cancel Second E-Sign Test';
const SECOND_ESIGN_ON_AUDIT = 'Second E-Sign ON';
const SECOND_ESIGN_OFF_AUDIT = 'Second E-Sign OFF';

test.beforeAll(async () => {
  validateEnvironmentVariables();
});

test.describe('[EDC] Second E-sign 테스트', () => {

  let context: BrowserContext;
  let eSignPage: ESignPage;

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

    eSignPage = new ESignPage(page, LANG);
  });

  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status === 'failed') {
      const page = eSignPage.getPage();
      const screenshotPath = `test-results/screenshots/${testInfo.title}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.error(`   실패한 테스트: ${testInfo.title}`);
      console.error(`   실패 원인: ${testInfo.error?.message}`);
      console.error(`   스크린샷: ${screenshotPath}`);
    }
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe.serial('[EDC] Second E-sign 플로우', () => {

    test(`1. 사용자가 ${SECOND_ESIGN} 버튼을 클릭하면, 전자 서명이 완료되며, 해당 페이지에 서명 날짜가 표기된다`, async () => {
      await test.step('DS CRF 페이지로 이동 및 필수 항목 입력', async () => {
        await eSignPage.scrollToVisit(ALL_VISIT);
        await eSignPage.goToCrfPage(ALL_VISIT, DS_PAGE_NAME);
        await eSignPage.setItemDateField('완료일/탈락일', 28);
        await eSignPage.setItemSingleSelectRadio(DS_ITEM_DSREAS_LABEL, DS_ITEM_DSREAS_ITEM_CODE_LABEL);
        await eSignPage.clickSave();
      });
      await test.step('Second E-Sign 서명 진행', async () => {
        await eSignPage.clickESignButton(SECOND_ESIGN, ESIGN_REASON, CDMS_LOGIN_CONFIG.accounts['owner'].email, CDMS_LOGIN_CONFIG.accounts['owner'].password);
      });
      await test.step('Second E-Sign 서명 표기 확인', async () => {
        await eSignPage.verifySecondESignVisible(CDMS_LOGIN_CONFIG.accounts['owner'].role, CDMS_LOGIN_CONFIG.accounts['owner'].name);
      });
    });

    test(`2. 사용자가 ${SECOND_ESIGN} 버튼을 클릭하여 전자 서명이 완료되면 Audit Trail에 ${SECOND_ESIGN_ON_AUDIT}로 표기된다`, async () => {
      await test.step(`Audit Trail에서 ${SECOND_ESIGN_ON_AUDIT} 텍스트 확인`, async () => {
        await eSignPage.verifyAuditTrailInAllRows(SECOND_ESIGN_ON_AUDIT, ESIGN_REASON);
      });
    });

    test(`3. 사용자가 ${CANCEL_SECOND_ESIGN} 버튼을 클릭하면, 전자 서명이 취소되며, 해당 페이지의 서명 날짜가 표기되지 않는다`, async () => {
      await test.step('Second E-Sign 서명 취소 진행', async () => {
        await eSignPage.clickCancelESignButton(CANCEL_SECOND_ESIGN, ESIGN_CANCELLATION_REASON, CDMS_LOGIN_CONFIG.accounts['owner'].email, CDMS_LOGIN_CONFIG.accounts['owner'].password);
      });
      await test.step('Second E-Sign 서명 날짜 미표기 확인', async () => {
        await eSignPage.verifySecondESignNotVisible(CDMS_LOGIN_CONFIG.accounts['owner'].role, CDMS_LOGIN_CONFIG.accounts['owner'].name);
      });
    });

    test(`4. 사용자가 ${CANCEL_SECOND_ESIGN} 버튼을 클릭하면, 전자 서명이 취소되며, Audit Trail에 ${SECOND_ESIGN_OFF_AUDIT}로 표기된다`, async () => {
      await test.step(`Audit Trail에서 ${SECOND_ESIGN_OFF_AUDIT} 텍스트 확인`, async () => {
        await eSignPage.verifyAuditTrailInAllRows(SECOND_ESIGN_OFF_AUDIT, ESIGN_CANCELLATION_REASON);
      });
    });

  });

});