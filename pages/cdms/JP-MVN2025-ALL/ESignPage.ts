import { expect } from '@playwright/test';
import { BaseCDMSPage } from '../common/BaseCDMSPage';

export class ESignPage extends BaseCDMSPage {

  // E-Sign 버튼 클릭 및 서명 사유 입력
  async clickESignButton(buttonName: string, reason: string, id: string, pw: string): Promise<void> {
    await this.page.getByRole('button', { name: buttonName, exact: true }).click();
    await this.page.getByPlaceholder('Enter Your Email').fill(id);
    await this.page.getByPlaceholder('Enter Your Password').fill(pw);
    await this.page.getByPlaceholder('Please enter the reason for the E-Sign.').fill(reason);
    await this.page.waitForTimeout(500);
    await this.page.getByRole('button', { name: 'Confirm & Sign', exact: true }).click();
    await this.page.waitForResponse(
      resp => resp.url().includes('/statuses') && resp.status() === 200
    );
  }

  // E-Sign 취소 버튼 클릭 및 취소 사유 입력
  async clickCancelESignButton(buttonName: string, reason: string, id: string, pw: string): Promise<void> {
    await this.page.getByRole('button', { name: buttonName, exact: true }).click();
    await this.page.getByPlaceholder('Enter Your Email').fill(id);
    await this.page.getByPlaceholder('Enter Your Password').fill(pw);
    await this.page.getByPlaceholder('Please enter the reason for canceling the E-Sign.').fill(reason);
    await this.page.getByRole('button', { name: 'Confirm & Sign', exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.waitForResponse(
      resp => resp.url().includes('/statuses') && resp.status() === 200
    );
  }

  // 서명 날짜 표기 여부 확인
  async verifySecondESignDateVisible(): Promise<void> {
    await this.page.waitForSelector('.app-study-crf-second-signed-at');
    await expect(this.page.locator('.app-study-crf-second-signed-at')).toBeVisible();
  }

  // 서명 날짜 미표기 확인
  async verifySecondESignDateNotVisible(): Promise<void> {
    await expect(this.page.locator('.app-study-crf-second-signed-at')).toHaveCount(0);
  }

  // 서명 영역 클릭 (취소 버튼 노출용)
  async clickSignatureArea(): Promise<void> {
    await this.page.locator('.app-study-crf-signature-wrap').click();
  }

  // .misc 행 전체에서 Audit Trail을 열고 특정 텍스트 포함 여부 확인
  async verifyAuditTrailInAllRows(reason: string, expectedAuditText: string): Promise<void> {
    const rows = this.page.locator('.misc');
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const currentRow = rows.nth(i);
      const auditTrailButton = currentRow.locator('.GrIconButton').last();
      await auditTrailButton.click();

      const rowLocator = this.page.getByRole('row', { name: reason });
      await expect(rowLocator).toContainText(expectedAuditText);
    }
  }
}