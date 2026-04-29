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
  }

  // 서명 완료 표기 여부 확인
  async verifySecondESignVisible(role: string, name: string): Promise<void> {
    await expect(this.page.getByText(`Second E-Signed by.`)).toBeVisible();
    await expect(this.page.locator('span').filter({ hasText: `[${role}] ${name}` })).toBeVisible();
  }

  // 서명 완료 미표기 확인
  async verifySecondESignNotVisible(role: string, name: string): Promise<void> {
    await expect(this.page.getByText(`Second E-Signed by.`)).toHaveCount(0);
    await expect(this.page.locator('span').filter({ hasText: `[${role}] ${name}` })).toHaveCount(0);
  }

  // 서명 영역 클릭 (취소 버튼 노출용)
  async clickSignatureArea(): Promise<void> {
    await this.page.locator('.app-study-crf-signature-wrap').click();
  }

  // .misc 행 전체에서 Audit Trail을 열고 특정 텍스트 포함 여부 확인
  async verifyAuditTrailInAllRows(expectedAuditText: string, expectedReasonText: string): Promise<void> {
    const rows = this.page.locator('.misc');
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const currentRow = rows.nth(i);
      const auditTrailButton = currentRow.getByLabel('Audit Trail').getByRole('button');
      if(await auditTrailButton.isVisible()){
        await auditTrailButton.click();
      } else {
        break;
      }
      
      const auditLocator = this.page.getByRole("presentation").locator("[data-list-index='0'] [data-automation-key='2']");
      await expect(auditLocator).toContainText(expectedAuditText);
      const reasonLocator = this.page.getByRole("presentation").locator("[data-list-index='0'] [data-automation-key='5']");
      await expect(reasonLocator).toContainText(expectedReasonText);
    }
  }
}