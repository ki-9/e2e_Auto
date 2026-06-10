import { expect } from '@playwright/test';
import { BaseCDMSPage } from '../common/BaseCDMSPage';
import { getLabel } from '../../common/LanguageConfig';

export class ReportPage extends BaseCDMSPage {

  // Report 메뉴로 이동
  async navigateToReportMenu(reportType: string): Promise<void> {
    await this.page.getByRole('link', { name: `${reportType} Report` }).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // Report 목록에서 특정 Term 확인
  async verifyReportTermInList(term: string): Promise<void> {
    await expect(
      this.page.locator("[data-automation-key='5']").first()
    ).toHaveText(term);
  }

  // 첫 번째 Report 페이지 진입
  async openFirstReport(): Promise<void> {
    await this.page.locator("[data-automation-key='3'] > a").first().click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // Report Merge Table 데이터 스캔 (input 요소 포함)
  async scanMergeTableData(): Promise<string[]> {
    const reportData: string[] = [];
    await this.page.waitForTimeout(3000);

    const cells = this.page.locator('[aria-label="Appendable Table Body Data"]').nth(1).locator('[class*="td"]');
    const count = await cells.count();

    for (let i = 0; i < count; i++) {
      let txt = await cells.nth(i).innerText();

      if (txt === '') {
        const childCount = await cells.nth(i).locator('*').count();
        for (let j = 0; j < childCount; j++) {
          const isInput = await cells
            .nth(i)
            .locator('*')
            .nth(j)
            .evaluate(el => el.tagName.toLowerCase() === 'input');
          if (isInput) {
            txt = await cells.nth(i).locator('*').nth(j).inputValue();
            break;
          }
        }
      }
      reportData.push(txt);
    }
    return reportData;
  }

  // Report 데이터에 특정 Term 포함 여부 확인
  verifyTermInReportData(reportData: string[], term: string): void {
    expect(reportData).toContainEqual(term);
  }

  // 필수값 미입력 저장 시 경고 토스트 및 하이라이트 확인
  async verifyWarningOnSaveWithoutRequired(): Promise<void> {
    await this.page
      .getByRole('button', { name: getLabel('save', 'en'), exact: true })
      .click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.locator('[severity="danger"]')).toBeVisible({ timeout: 3000 });
    await expect(this.page.locator("[class*='highlight']")).toBeVisible({ timeout: 3000 });
  }

  // 필수값 입력
  async fillRequiredField(label: string): Promise<void> {
    await this.page.getByRole('row', { name: label }).locator('label').first().click();
  }

  // 필수값 제거
  async removeRequiredField(label: string): Promise<void> {
    await this.page.getByRole('row', { name: label }).locator('label').first().click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // Report 저장 후 제출 버튼 노출 확인
  async saveAndVerifySubmitButtonVisible(submitButtonLabel: string): Promise<void> {
    await this.page
      .getByRole('button', { name: getLabel('save', 'en'), exact: true })
      .click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.getByRole('button', { name: submitButtonLabel })).toBeVisible();
  }

  // 제출 버튼 비활성화 확인
  async verifySubmitButtonDisabled(submitButtonLabel: string): Promise<void> {
    await expect(this.page.getByRole('button', { name: submitButtonLabel })).toBeDisabled();
  }

  // Report 제출 (재로드 + 본인 확인 포함)
  async submitReport(
    submitButtonLabel: string,
    confirmAlterLabel: string,
    email: string,
    password: string
  ): Promise<void> {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await this.page.getByRole('button', { name: submitButtonLabel }).click();
    await this.page.getByRole('button', { name: confirmAlterLabel }).click();
    await this.page.getByPlaceholder('Please enter your email address.', { exact: true }).fill(email);
    await this.page.getByPlaceholder('Please enter your password.', { exact: true }).fill(password);
    await this.page
      .getByRole('button', { name: getLabel('confirm', this.lang), exact: true })
      .click();
    await expect(this.page.locator('.fx-notification.--succ')).toBeVisible({ timeout: 3000 });
    await this.page.locator('.fx-notification .close').click();
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  // F/U Report 생성 및 탭 2개 확인
  async createFollowUpReport(createFULabel: string): Promise<void> {
    await this.page.getByRole('button', { name: createFULabel }).click();
    await expect(this.page.locator('.fx-notification.--succ')).toBeVisible({ timeout: 5000 });
    await this.page.locator('.fx-notification .close').click();
    await expect(this.page.locator("[role='tab']")).toHaveCount(2);
  }

  // Sync 팝업 열기 및 Sync 가능 항목 없음 확인
  async verifySyncEmpty(syncButtonLabel: string, cancelLabel: string): Promise<void> {
    await this.page.getByRole('button', { name: syncButtonLabel }).click();
    await this.page.waitForSelector("[role='heading']");
    await expect(this.page.locator("[class*='cr-table-empty']")).toBeVisible();
    await expect(this.page.getByRole('button', { name: syncButtonLabel })).toBeDisabled();
    await this.page.getByRole('button', { name: cancelLabel }).click();
  }

  // Sync 팝업 열기 및 행 수 확인 (팝업 열린 채로 유지)
  async openSyncPopupAndVerifyItemCount(
    syncButtonLabel: string,
    expectedRowCount: number
  ): Promise<void> {
    await this.page.getByRole('button', { name: syncButtonLabel }).click();
    await this.page.waitForSelector("[role='heading']");
    await expect(
      this.page.locator(`[aria-rowcount='${expectedRowCount}']`)
    ).toBeVisible();
  }

  // Sync 팝업에서 특정 인덱스의 항목 값 확인
  async verifySyncItemValue(index: number, expectedValue: string): Promise<void> {
    await expect(
      this.page.locator("[data-automation-key='6']").nth(index)
    ).toHaveText(expectedValue);
  }

  // Sync 팝업 내 Sync 버튼 비활성화 확인 (팝업 닫지 않음)
  async verifySyncButtonDisabledInPopup(syncButtonLabel: string): Promise<void> {
    await expect(
      this.page.getByRole('button', { name: syncButtonLabel })
    ).toBeDisabled();
  }

  // 첫 번째 Sync 항목 선택 → Sync 버튼 활성화 확인 → Sync 실행 및 성공 확인
  async selectAndPerformSync(syncButtonLabel: string): Promise<void> {
    await this.page.locator("[data-automationid='DetailsRowCheck']").first().click();
    await expect(
      this.page.getByRole('button', { name: syncButtonLabel })
    ).not.toHaveClass(/disabled/, { timeout: 5000 });
    await this.page.getByRole('button', { name: syncButtonLabel }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.locator('.fx-notification.--succ')).toBeVisible();
    await this.page.locator('.fx-notification .close').click();
  }

  // Sync 수행 후 Report 페이지의 Height 값 확인
  async verifyHeightValueInReport(height: string): Promise<void> {
    await this.page.waitForSelector('td');
    const cells = this.page.locator('td');
    const totalTd = await cells.count();

    let targetIndex = -1;
    for (let i = 0; i < totalTd; i++) {
      if ((await cells.nth(i).innerText()) === 'Height') {
        targetIndex = i;
        break;
      }
    }

    await expect(
      cells.nth(targetIndex + 1).locator("[type='text']")
    ).toHaveValue(height);
  }

  // Sync 수행 후 Report 페이지의 Sex 선택 상태 확인
  async verifySexInReport(sex: string, isChecked: boolean): Promise<void> {
    const checkState = await this.page.getByLabel(sex, { exact: true }).isChecked();
    expect(checkState).toBe(isChecked);
  }

  // Sync 팝업 닫기
  async closeSyncPopup(cancelLabel: string): Promise<void> {
    await this.page.getByRole('button', { name: cancelLabel }).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // Report 목록에서 --strike 처리되지 않은 첫 번째 Report 탐색
  async findFirstActiveReportSeq(): Promise<{ targetReport: string; targetSeq: number }> {
    await this.page.waitForSelector("[data-automation-key='3'] > a");
    const count = await this.page.locator("[data-automation-key='3'] > a").count();

    for (let seq = 0; seq < count; seq++) {
      const rowClass = await this.page
        .locator(`[data-list-index="${seq}"] > *`)
        .getAttribute('class');

      if (!rowClass?.includes('--strike')) {
        const targetReport = await this.page
          .locator("[data-automation-key='5']")
          .nth(seq)
          .innerText();
        return { targetReport, targetSeq: seq };
      }
    }
    throw new Error('삭제되지 않은 Report를 찾을 수 없습니다.');
  }

  // 특정 인덱스의 Report 링크 클릭 및 페이지 이동 확인
  async openReportBySeq(targetSeq: number): Promise<void> {
    await this.page
      .locator("[data-automation-key='3'] > a")
      .nth(targetSeq)
      .click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page).toHaveURL(/\/reports\/\w+/);
  }

  // Report 수정 저장 (수정사유 선택, Confirm 없음)
  async saveReportWithReason(reason: string = 'New Data'): Promise<void> {
    await this.page
      .getByRole('button', { name: getLabel('save', 'en'), exact: true })
      .click();
    await this.page.getByText(reason).click();
    await this.page
      .getByRole('button', { name: getLabel('save', 'en'), exact: true })
      .click();
  }

  // Footer Bar의 Go to CRF 버튼 클릭
  // TODO: 'Go to CRF' 버튼 텍스트 실제 DOM 확인 필요
  async clickGoToCRFButton(): Promise<void> {
    await this.page.getByRole('button', { name: 'Go to CRF' }).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // Save 버튼 미노출 확인 (취소된 Report)
  async verifySaveButtonNotVisible(): Promise<void> {
    await expect(
      this.page.getByRole('button', { name: getLabel('save', 'en'), exact: true })
    ).not.toBeVisible();
  }

  // Save 버튼 노출 확인 (복원된 Report)
  async verifySaveButtonVisible(): Promise<void> {
    await expect(
      this.page.getByRole('button', { name: getLabel('save', 'en'), exact: true })
    ).toBeVisible();
  }

  // 특정 인덱스의 Report --strike 클래스 여부 확인
  async verifyReportStrikeStatus(targetSeq: number, hasStrike: boolean): Promise<void> {
    const rowClass = await this.page
      .locator(`[data-list-index="${targetSeq}"] > *`)
      .getAttribute('class');
    expect(rowClass?.includes('--strike')).toBe(hasStrike);
  }

  // Report List 버튼 클릭 후 목록 로딩 대기
  async clickReportListButton(): Promise<void> {
    await this.page.getByRole('button', { name: 'Report List' }).click();
    await this.page.waitForSelector("[data-automation-key='3'] > a");
  }
}