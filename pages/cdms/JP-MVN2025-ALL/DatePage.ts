import { expect } from '@playwright/test';
import { BaseCDMSPage } from '../common/BaseCDMSPage';

export class DatePage extends BaseCDMSPage {

  // 날짜 텍스트 필드 직접 입력
  // td:has-text() 기반 셀렉터 사용 (달력 UI가 아닌 직접 입력 필드)
  async fillDateTextField(label: string, value: string): Promise<void> {
    await this.page
      .locator(`td:has-text('${label}') + td .ms-TextField input`)
      .fill(value);
  }

  // 특정 텍스트가 포함된 모달 창 표시 확인
  async verifyDialogVisible(expectedText: string): Promise<void> {
    await this.page.waitForTimeout(1000);
    await expect(this.page.locator('.MuiPaper-root').last()).toContainText(expectedText);
  }

  // Auto Query 갯수 비교
  async verifyAutoQueryOnEmptyFields(expectedCount: number): Promise<void> {
    const actualCount = await this.page.locator('[class="message"]').count();
    expect(actualCount).toBe(expectedCount);
  }

  // Audit 아이콘 버튼 클릭 후 응답 대기
  async openAuditTrail(label: string): Promise<void> {
    await this.page.locator(`tr:has-text('${label}')`).getByLabel('Audit Trail').click();
    expect(await this.page.waitForSelector('.ms-Callout-main .ms-List-cell'));
  }

  // Audit 첫 번째 항목에서 값 확인 (최초 저장 시)
  async verifyFirstAuditContains(value: string): Promise<void> {
    await expect(
      this.page.locator('.ms-Callout-main .ms-List-cell').first()
    ).toContainText(value);
  }

  // Audit 항목에서 값 확인 (수정 저장 시)
  async verifyAuditContains(value: string): Promise<void> {
    await expect(
      this.page.locator('.ms-Callout .ms-List-cell').first()
    ).toContainText(value);
  }

  // Audit Data 항목에서 값 확인
  async verifyAuditDataContains(value: string): Promise<void> {
    await expect(
      this.page.locator(".ms-Callout .ms-List-cell:has-text('Data')").first()
    ).toContainText(value);
  }
}