import { test, expect, BrowserContext } from '@playwright/test';
import { LoginPage, CDMS_LOGIN_CONFIG } from '../../../pages/common/LoginPage';
import { StudyListPage } from '../../../pages/cdms/common/StudyListPage';
import { SubjectListPage } from '../../../pages/cdms/common/SubjectListPage';
import { SubjectPage } from '../../../pages/cdms/ML42494/SubjectPage';
import { AEPage } from '../../../pages/cdms/ML42494/AEPage';
import { ReportPage } from '../../../pages/cdms/ML42494/ReportPage';
import { DMPage } from '../../../pages/cdms/ML42494/DMPage';
import { validateEnvironmentVariables } from '../../helpers/test-helpers';

const LANG = 'en';
const STUDY_PROTOCOL_NO = 'ML42494_Auto';
const CONDUCT_YES = 'Yes';
const ADVERSE_EVENT_YES = 'Yes→ (All AEs should be';
const REQUIRED_YES = 'Does the reporter consent to';
const REPORT_TYPES = ['SAE', 'AESI'] as const;
type ReportType = (typeof REPORT_TYPES)[number];
const REPORT_BUTTON_LABELS = {
    submit: 'Submit Report',
    createFollowUp: 'Create Follow-up Report',
    sync: 'Sync',
    confirmAlter: 'Confirm',
    cancel: 'Cancel',
} as const;

function generateRandomNumber(min: number, max: number): string {
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

test.beforeAll(async () => {
  validateEnvironmentVariables();
});

test.describe.serial('ML42494 Report 생성 테스트', () => {

  let context: BrowserContext;
  let subjectPage: SubjectPage;
  let aePage: AEPage;
  let reportPage: ReportPage;
  let dmPage: DMPage;
  let targetReport: string;
  let targetSeq: number;
  let targetAeSeq: number;

  const timestamp = Date.now();
  const saeReportTerm = `TestSaeTerm${timestamp}`;
  const aesiReportTerm = `TestAesiTerm${timestamp}`;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    const page = await context.newPage();

    const loginPage = new LoginPage(page, CDMS_LOGIN_CONFIG);
    await loginPage.loginWithDeviceKey('pi');

    const studyListPage = new StudyListPage(page, LANG);
    await studyListPage.navigate();
    await studyListPage.selectStudy(STUDY_PROTOCOL_NO);

    subjectPage = new SubjectPage(page, LANG);
    aePage = new AEPage(page, LANG);
    reportPage = new ReportPage(page, LANG);
    dmPage = new DMPage(page, LANG);
  });

  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status === 'failed' && aePage) {
      const page = aePage.getPage();
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

  test.describe.serial('Subject 생성', () => {

    test('Subject를 생성하면 Schedule 페이지로 이동된다', async () => {
      await test.step('Subject 추가 폼 열기', async () => {
        await subjectPage.openAddSubjectForm();
      });
      await test.step('Subject 정보 입력 및 저장', async () => {
        await subjectPage.fillSubjectForm();
        await subjectPage.saveAndVerifySchedulePage();
        await subjectPage.verifySuccessToast();
      });
    });

  });

  test.describe.serial('AE 데이터 입력 및 Report 테스트', () => {

    test('1. Subject의 AE 페이지로 이동한다', async () => {
      await test.step('AE 페이지 이동 및 URL 확인', async () => {
        await aePage.navigateToAEPage();
        await expect(aePage.getPage()).toHaveURL(/\/AV\/AE\/1\/AE\/1/);
      });
    });

    test('2. SAE 이상사례를 입력한다', async () => {
      await test.step('AE 발생 여부 체크', async () => {
        await aePage.checkLabelIfUnchecked(CONDUCT_YES);
        await aePage.checkLabelIfUnchecked(ADVERSE_EVENT_YES);
      });
      await test.step('SAE Term 입력', async () => {
        const hasExistingRow = await aePage.getPage()
          .getByRole('cell', { name: '[Adverse Event Term]' })
          .isVisible();
        if (!hasExistingRow) {
          await aePage.addNewAERow();
        }
        await aePage.expandAERow();
        await aePage.fillAETerm(saeReportTerm);
      });
      await test.step('SAE Seriousness 설정 및 저장', async () => {
        await aePage.setSAESeriousness();
        await aePage.saveAEWithConfirm();
      });
    });

    test('3. Non-Seriousness 이상사례를 입력한다', async () => {
      await test.step('AESI 행 추가 및 Term 입력', async () => {
        await aePage.addNewAERow();
        await aePage.expandAERow();
        await aePage.fillAETerm(aesiReportTerm);
      });
      await test.step('AESI 조건 설정 및 수정 저장', async () => {
        await aePage.setAESISeriousnessAndCondition();
        await aePage.modifySaveAEWithReason('New Data');
      });
    });

    // ── Report Type별 반복 테스트 ──────────────────────────
    REPORT_TYPES.forEach((reportType: ReportType) => {

      const reportTerm = reportType === 'SAE' ? saeReportTerm : aesiReportTerm;

      test.describe.serial(`${reportType} Report 테스트`, () => {

        test(`${reportType} Report가 생성된다`, async () => {
          await test.step(`${reportType} Report 메뉴 진입`, async () => {
            await reportPage.navigateToReportMenu(reportType);
          });
          await test.step('Report 목록에서 Term 확인', async () => {
            await reportPage.verifyReportTermInList(reportTerm);
          });
          await test.step('Report 페이지 진입 및 Merge Table 데이터 확인', async () => {
            await reportPage.openFirstReport();
            const reportData = await reportPage.scanMergeTableData();
            reportPage.verifyTermInReportData(reportData, reportTerm);
          });
        });

        test(`필수 값이 입력되지 않으면 ${reportType} Report가 저장되지 않는다`, async () => {
          await test.step('필수값 미입력 상태로 저장 시도 — 경고 확인', async () => {
            await reportPage.verifyWarningOnSaveWithoutRequired();
          });
        });

        test(`필수 값이 입력되면 ${reportType} Report가 저장된다`, async () => {
          await test.step('필수값 입력 후 저장 — 제출 버튼 노출 확인', async () => {
            await reportPage.fillRequiredField(REQUIRED_YES);
            await reportPage.saveAndVerifySubmitButtonVisible(REPORT_BUTTON_LABELS.submit);
          });
        });

        test(`필수 값이 입력되지 않으면 ${reportType} Report가 제출되지 않는다`, async () => {
          await test.step('필수값 제거 후 제출 버튼 비활성화 확인', async () => {
            await reportPage.removeRequiredField(REQUIRED_YES);
            await reportPage.verifySubmitButtonDisabled(REPORT_BUTTON_LABELS.submit);
          });
        });

        test(`필수 값이 입력되면 ${reportType} Report가 제출된다`, async () => {
          await test.step('필수값 재입력 후 제출', async () => {
            await reportPage.fillRequiredField(REQUIRED_YES);
            await reportPage.submitReport(
              REPORT_BUTTON_LABELS.submit,
              REPORT_BUTTON_LABELS.confirmAlter,
              CDMS_LOGIN_CONFIG.accounts['pi'].email,
              CDMS_LOGIN_CONFIG.accounts['pi'].password
            );
          });
        });

        test(`제출된 ${reportType} Report에서 F/U Report가 생성된다`, async () => {
          await test.step('F/U Report 생성 및 탭 2개 확인', async () => {
            await reportPage.createFollowUpReport(REPORT_BUTTON_LABELS.createFollowUp);
          });
        });

        test(`생성 직후의 ${reportType} Report에서 Sync 가능 항목은 없다`, async () => {
          await test.step('Sync 팝업 열기 및 빈 데이터 확인', async () => {
            await reportPage.verifySyncEmpty(
              REPORT_BUTTON_LABELS.sync,
              REPORT_BUTTON_LABELS.cancel
            );
          });
        });
      });
    });
  });

  test.describe.serial('Report Merge Table 테스트', () => {

    const HEIGHT = generateRandomNumber(100, 250);
    const WEIGHT = generateRandomNumber(20, 200);

    test('1. DM 페이지로 이동한다', async () => {
      await test.step('Subject 메뉴 → 첫 번째 Subject → DM 페이지 이동 확인', async () => {
        await dmPage.navigateToDMPage();
      });
    });

    test('2. DM 페이지에 데이터를 입력하고 저장한다', async () => {
      await test.step('Sex, Height, Weight 입력', async () => {
        await dmPage.fillDMData('Male', HEIGHT, WEIGHT);
      });
      await test.step('저장 및 성공 확인', async () => {
        await dmPage.clickSave();
      });
    });

    test('3. DM 페이지에서 입력한 데이터가 Report Sync 가능 항목에 표시된다', async () => {
      await test.step('SAE Report 진입 및 Sync 팝업 열기', async () => {
        await reportPage.navigateToReportMenu('SAE');
        await reportPage.openFirstReport();
        await reportPage.openSyncPopupAndVerifyItemCount(REPORT_BUTTON_LABELS.sync, 4);
      });
      await test.step('Sync 가능 항목 값 및 버튼 비활성화 확인', async () => {
        await reportPage.verifySyncItemValue(0, 'Male');
        await reportPage.verifySyncItemValue(1, HEIGHT);
        await reportPage.verifySyncButtonDisabledInPopup(REPORT_BUTTON_LABELS.sync);
      });
    });

    test('4. Sync 가능 항목들을 Sync 수행한다', async () => {
      await test.step('첫 번째 항목 선택 및 Sync 실행', async () => {
        await reportPage.selectAndPerformSync(REPORT_BUTTON_LABELS.sync);
      });
    });

    test('5. Sync 수행한 데이터가 Report 페이지에 반영된다', async () => {
      await test.step('Height 값 및 Sex 선택 상태 확인', async () => {
        await reportPage.verifyHeightValueInReport(HEIGHT);
        await reportPage.verifySexInReport('Male', true);
      });
    });

    test('6. Sync 가능 항목들이 존재하지 않는다', async () => {
      await test.step('Sync 팝업 열기 및 빈 데이터 확인', async () => {
        await reportPage.openSyncPopupAndVerifyItemCount(REPORT_BUTTON_LABELS.sync, 1);
        await reportPage.verifySyncButtonDisabledInPopup(REPORT_BUTTON_LABELS.sync);
        await reportPage.closeSyncPopup(REPORT_BUTTON_LABELS.cancel);
      });
    });

    test('7. DM 페이지 Initialize를 수행한다', async () => {
      await test.step('DM 페이지 이동 및 Initialize 실행', async () => {
        await dmPage.navigateToDMPage();
        await dmPage.clickInitializeButton("initialize Test", CDMS_LOGIN_CONFIG.accounts['pi'].email, CDMS_LOGIN_CONFIG.accounts['pi'].password);
      });
    });

    test('8. DM 페이지에서 초기화한 데이터가 Report Sync 가능 항목에 표시된다', async () => {
      await test.step('SAE Report 진입 및 Sync 팝업 열기', async () => {
        await reportPage.navigateToReportMenu('SAE');
        await reportPage.openFirstReport();
        await reportPage.openSyncPopupAndVerifyItemCount(REPORT_BUTTON_LABELS.sync, 4);
      });
      await test.step('초기화된 항목 값 및 버튼 비활성화 확인', async () => {
        await reportPage.verifySyncItemValue(0, '[Null] (Initialized)');
        await reportPage.verifySyncItemValue(1, '[Null] (Initialized)');
        await reportPage.verifySyncButtonDisabledInPopup(REPORT_BUTTON_LABELS.sync);
      });
    });

    test('9. Sync 가능 항목들을 Sync 수행한다', async () => {
      await test.step('첫 번째 항목 선택 및 Sync 실행', async () => {
        await reportPage.selectAndPerformSync(REPORT_BUTTON_LABELS.sync);
      });
    });

    test('10. Sync 수행한 데이터가 Report 페이지에 반영된다', async () => {
      await test.step('Height 빈 값 및 Sex 미선택 확인', async () => {
        await reportPage.verifyHeightValueInReport('');
        await reportPage.verifySexInReport('Male', false);
      });
    });

    test('11. Sync 가능 항목들이 존재하지 않는다', async () => {
      await test.step('Sync 팝업 열기 및 빈 데이터 확인', async () => {
        await reportPage.openSyncPopupAndVerifyItemCount(REPORT_BUTTON_LABELS.sync, 1);
        await reportPage.verifySyncButtonDisabledInPopup(REPORT_BUTTON_LABELS.sync);
        await reportPage.closeSyncPopup(REPORT_BUTTON_LABELS.cancel);
        await reportPage.saveReportWithReason('New Data');
      });
    });
  });

  test.describe.serial('Report 삭제 테스트', () => {

    test('1. SAE Report 페이지로 이동한다', async () => {
      await test.step('SAE Report 메뉴 진입', async () => {
        await reportPage.navigateToReportMenu('SAE');
      });
      await test.step('삭제되지 않은 첫 번째 Report 탐색 및 진입', async () => {
        const result = await reportPage.findFirstActiveReportSeq();
        targetReport = result.targetReport;
        targetSeq    = result.targetSeq;
        await reportPage.openReportBySeq(targetSeq);
      });
    });

    test('2. Report 페이지에서 CRF 페이지로 이동된다', async () => {
      await test.step('CRF 페이지 이동 및 AE Term 셀 확인', async () => {
        await reportPage.clickGoToCRFButton();
        await aePage.verifyAETermCellVisible(targetReport);
      });
    });

    test('3. Report를 생성시킨 이상사례의 행을 삭제한다', async () => {
      await test.step('AE Term으로 행 탐색 및 Delete 아이콘 클릭', async () => {
        targetAeSeq = await aePage.deleteAERowByTerm(targetReport);
      });
      await test.step('저장 후 --strike 반영 확인', async () => {
        await aePage.modifySaveAEWithReason('New Data');
        await aePage.verifyAERowStrikeStatus(targetAeSeq, true);
      });
    });

    test('4. 삭제한 이상사례의 Report가 취소된다', async () => {
      await test.step('SAE Report 메뉴 이동', async () => {
        await reportPage.navigateToReportMenu('SAE');
      });
      await test.step('해당 Report --strike 처리 확인', async () => {
        await reportPage.verifyReportStrikeStatus(targetSeq, true);
      });
    });

  });

  test.describe.serial('Report 복원 테스트', () => {

    test('1. 취소된 Report 페이지로 이동한다', async () => {
      await test.step('취소된 Report 진입', async () => {
        await reportPage.openReportBySeq(targetSeq);
      });
      await test.step('Save 버튼 미노출 확인', async () => {
        await reportPage.verifySaveButtonNotVisible();
      });
    });

    test('2. 취소된 Report 페이지에서 CRF 페이지로 이동된다', async () => {
      await test.step('CRF 페이지 이동 및 AE Term 셀 확인', async () => {
        await reportPage.clickGoToCRFButton();
        await aePage.verifyAETermCellVisible(targetReport);
      });
    });

    test('3. 삭제했던 이상사례의 행을 복원한다', async () => {
      await test.step('복원 아이콘 클릭', async () => {
        await aePage.restoreAERowByIndex(targetAeSeq);
      });
      await test.step('저장 후 --strike 제거 확인', async () => {
        await aePage.modifySaveAEWithReason('New Data');
        await aePage.verifyAERowStrikeStatus(targetAeSeq, false);
      });
    });

    test('4. Report 아이콘으로 복원된 Report 페이지로 이동한다', async () => {
      await test.step('Report 아이콘 클릭 및 URL 확인', async () => {
        await aePage.clickReportIconOnAERow(targetAeSeq);
        await expect(aePage.getPage()).toHaveURL(/\/reports\/\w+/);
      });
      await test.step('Save 버튼 노출 확인', async () => {
        await reportPage.verifySaveButtonVisible();
      });
    });

    test('5. Report List에서 복원 여부를 확인한다', async () => {
      await test.step('Report List 이동', async () => {
        await reportPage.clickReportListButton();
      });
      await test.step('해당 Report --strike 제거 확인', async () => {
        await reportPage.verifyReportStrikeStatus(targetSeq, false);
      });
    });

  });
});