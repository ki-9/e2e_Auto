import { test, expect, BrowserContext } from '@playwright/test';
import { LoginPage, CDMS_LOGIN_CONFIG } from '../../../pages/common/LoginPage';
import { StudyListPage } from '../../../pages/cdms/common/StudyListPage';
import { SubjectListPage } from '../../../pages/cdms/common/SubjectListPage';
import { ESignPage } from '../../../pages/cdms/JP-MVN2025-ALL/ESignPage';
import { validateEnvironmentVariables } from '../../helpers/test-helpers';

const LANG = 'ko';
const STUDY_PROTOCOL_NO = 'JP-MVN2025-ALL_Auto';

const EN_VISIT_NAME = '등록';  
const ALL_VISIT = 'All Visit';
const EN_PAGE_NAME = '문서 동의 및 Screening No. 부여';
const DS_PAGE_NAME = '임상시험 종료';
const PROFILE_PAGE_NAME = 'PROFILE';
const EN_ASSIGN_TRIGGER_LABEL = 'PROFILE ASSIGN TEST';
const PROF_NAME_LABEL = 'Name';
const PROF_BIRTH_LABEL = 'Birth';
const PROF_CONTACT_LABEL = 'Contact';
const PROF_HNUM_LABEL = 'Hospital Registration Number';
const PROF_SEX_LABEL = 'Sex';
const GENDER_MALE = '남성';
const DS_ITEM_DSREAS_LABEL = '상태';
const DS_ITEM_DSREAS_ITEM_CODE_LABEL = '스크리닝 탈락';

const ESIGN = 'E-Sign';
const ESIGN_REASON = 'E-Sign Test';
const ESIGN_CANCELLATION_MODIFY_REASON = 'E-Sign Auto release (New Data)';
const ESIGN_CANCELLATION_TRIGGER_REASON = 'E-Sign Auto release (Trigger)';
const REFRESH_REASON = 'Refresh Test';
const ESIGN_ON_AUDIT = 'E-Sign On';
const ESIGN_OFF_AUDIT = 'E-Sign Off';
const ESIGN_BUTTON_COLOR_SIGNED   = 'rgb(253, 186, 0)';
const ESIGN_BUTTON_COLOR_UNSIGNED = 'rgb(255, 255, 255)';

const SECOND_ESIGN = 'Second E-Sign';
const CANCEL_SECOND_ESIGN = 'Cancel Second E-Sign';
const SECOND_ESIGN_REASON = 'Second E-Sign Test';
const SECOND_ESIGN_CANCELLATION_REASON = 'Cancel Second E-Sign Test';
const SECOND_ESIGN_ON_AUDIT = 'Second E-Sign ON';
const SECOND_ESIGN_OFF_AUDIT = 'Second E-Sign OFF';

test.beforeAll(async () => {
  validateEnvironmentVariables();
});

test.describe('[EDC] E-sign 테스트', () => {

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

  test.describe.serial('[EDC] E-Sign 플로우', () => {

    test('1. Profile 데이터 입력 및 E-Sign 수행', async () => {
      await test.step('Profile CRF 페이지 이동 및 데이터 입력', async () => {
        await eSignPage.scrollToVisit(ALL_VISIT);
        await eSignPage.goToCrfPage(ALL_VISIT, PROFILE_PAGE_NAME);
        await eSignPage.setItemTextField(PROF_NAME_LABEL, 'Test Name');
        await eSignPage.setItemDateField(PROF_BIRTH_LABEL, 20);
        await eSignPage.setItemTextField(PROF_CONTACT_LABEL, '010-1234-5678');
        await eSignPage.setItemSingleSelectRadio(PROF_SEX_LABEL, GENDER_MALE);
        await eSignPage.setItemTextField(PROF_HNUM_LABEL, '12345678');
        await eSignPage.clickSave();
      });
      await test.step('E-Sign 서명 완료 및 서명 상태 확인', async () => {
        await eSignPage.clickESignButton(ESIGN, ESIGN_REASON, CDMS_LOGIN_CONFIG.accounts['owner'].email, CDMS_LOGIN_CONFIG.accounts['owner'].password);
        await eSignPage.verifyESignVisible(CDMS_LOGIN_CONFIG.accounts['owner'].role, CDMS_LOGIN_CONFIG.accounts['owner'].name);
        await eSignPage.verifyESignButtonColor(ESIGN_BUTTON_COLOR_UNSIGNED);
      });
      await test.step(`Audit Trail에서 ${ESIGN_ON_AUDIT} 텍스트 확인`, async () => {
        await eSignPage.verifyAuditTrailInAllRows("E-Sign", ESIGN_ON_AUDIT, ESIGN_REASON);
      });
    });

    test('2. E-Sign 상태에서 데이터를 변경 후 저장했을 때 E-Sign이 해제된다', async () => {
      await test.step('데이터 수정 저장', async () => {
        await eSignPage.setItemTextField(PROF_NAME_LABEL, 'Modified Name');
        await eSignPage.clickModifySaveButton('New Data');
      });
      await test.step('E-Sign 해제 확인', async () => {
        await eSignPage.verifyESignNotVisible(CDMS_LOGIN_CONFIG.accounts['owner'].role, CDMS_LOGIN_CONFIG.accounts['owner'].name);
        await eSignPage.verifyESignButtonColor(ESIGN_BUTTON_COLOR_SIGNED);
      });
      await test.step(`Audit Trail에서 ${ESIGN_OFF_AUDIT} 텍스트 확인`, async () => {
        await eSignPage.verifyAuditTrailInRow(PROF_NAME_LABEL, "E-Sign", ESIGN_OFF_AUDIT, ESIGN_CANCELLATION_MODIFY_REASON);
      });
    });

    test('3. E-Sign 상태에서 Assign Trigger가 실행 될 경우 E-Sign이 해제된다', async () => {
      await test.step('E-Sign 재서명', async () => {
        await eSignPage.clickESignButton(ESIGN, ESIGN_REASON, CDMS_LOGIN_CONFIG.accounts['owner'].email, CDMS_LOGIN_CONFIG.accounts['owner'].password);
        await eSignPage.verifyESignVisible(CDMS_LOGIN_CONFIG.accounts['owner'].role, CDMS_LOGIN_CONFIG.accounts['owner'].name);
      });
      await test.step('Assign Trigger 적용 항목 수정', async () => {
        await eSignPage.goToCrfPage(EN_VISIT_NAME, EN_PAGE_NAME);
        await eSignPage.setItemTextField(EN_ASSIGN_TRIGGER_LABEL, 'Trigger Value');
        await eSignPage.clickModifySaveButton('New Data');
      });
      await test.step('Profile 페이지 복귀 후 E-Sign 해제 확인', async () => {
        await eSignPage.goToCrfPage(ALL_VISIT, PROFILE_PAGE_NAME);
        await eSignPage.verifyESignNotVisible(CDMS_LOGIN_CONFIG.accounts['owner'].role, CDMS_LOGIN_CONFIG.accounts['owner'].name);
        await eSignPage.verifyESignButtonColor(ESIGN_BUTTON_COLOR_SIGNED);
      });
      await test.step(`Audit Trail에서 ${ESIGN_OFF_AUDIT} 텍스트 확인`, async () => {
        await eSignPage.verifyAuditTrailInRow(PROF_NAME_LABEL, "E-Sign", ESIGN_OFF_AUDIT, ESIGN_CANCELLATION_TRIGGER_REASON);
      });
    });

    test('4. E-Sign 상태에서 Refresh 실행 후 변경되는 데이터가 없다면 E-Sign이 유지된다', async () => {
      await test.step('E-Sign 재서명', async () => {
        await eSignPage.clickESignButton(ESIGN, ESIGN_REASON, CDMS_LOGIN_CONFIG.accounts['owner'].email, CDMS_LOGIN_CONFIG.accounts['owner'].password);
        await eSignPage.verifyESignVisible(CDMS_LOGIN_CONFIG.accounts['owner'].role, CDMS_LOGIN_CONFIG.accounts['owner'].name);
      });
      await test.step('Refresh 실행 후 E-Sign 유지 확인', async () => {
        await eSignPage.clickRefreshButton(REFRESH_REASON, CDMS_LOGIN_CONFIG.accounts['owner'].email, CDMS_LOGIN_CONFIG.accounts['owner'].password);
        await eSignPage.verifyESignVisible(CDMS_LOGIN_CONFIG.accounts['owner'].role, CDMS_LOGIN_CONFIG.accounts['owner'].name);
        await eSignPage.verifyESignButtonColor(ESIGN_BUTTON_COLOR_UNSIGNED);
      });
    });

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
        await eSignPage.clickESignButton(SECOND_ESIGN, SECOND_ESIGN_REASON, CDMS_LOGIN_CONFIG.accounts['owner'].email, CDMS_LOGIN_CONFIG.accounts['owner'].password);
      });
      await test.step('Second E-Sign 서명 표기 확인', async () => {
        await eSignPage.verifySecondESignVisible(CDMS_LOGIN_CONFIG.accounts['owner'].role, CDMS_LOGIN_CONFIG.accounts['owner'].name);
      });
    });

    test(`2. 사용자가 ${SECOND_ESIGN} 버튼을 클릭하여 전자 서명이 완료되면 Audit Trail에 ${SECOND_ESIGN_ON_AUDIT}로 표기된다`, async () => {
      await test.step(`Audit Trail에서 ${SECOND_ESIGN_ON_AUDIT} 텍스트 확인`, async () => {
        await eSignPage.verifyAuditTrailInAllRows("All Types", SECOND_ESIGN_ON_AUDIT, SECOND_ESIGN_REASON);
      });
    });

    test(`3. 사용자가 ${CANCEL_SECOND_ESIGN} 버튼을 클릭하면, 전자 서명이 취소되며, 해당 페이지의 서명 날짜가 표기되지 않는다`, async () => {
      await test.step('Second E-Sign 서명 취소 진행', async () => {
        await eSignPage.clickCancelESignButton(CANCEL_SECOND_ESIGN, SECOND_ESIGN_CANCELLATION_REASON, CDMS_LOGIN_CONFIG.accounts['owner'].email, CDMS_LOGIN_CONFIG.accounts['owner'].password);
      });
      await test.step('Second E-Sign 서명 날짜 미표기 확인', async () => {
        await eSignPage.verifySecondESignNotVisible(CDMS_LOGIN_CONFIG.accounts['owner'].role, CDMS_LOGIN_CONFIG.accounts['owner'].name);
      });
    });

    test(`4. 사용자가 ${CANCEL_SECOND_ESIGN} 버튼을 클릭하면, 전자 서명이 취소되며, Audit Trail에 ${SECOND_ESIGN_OFF_AUDIT}로 표기된다`, async () => {
      await test.step(`Audit Trail에서 ${SECOND_ESIGN_OFF_AUDIT} 텍스트 확인`, async () => {
        await eSignPage.verifyAuditTrailInAllRows("All Types", SECOND_ESIGN_OFF_AUDIT, SECOND_ESIGN_CANCELLATION_REASON);
      });
    });

  });

});