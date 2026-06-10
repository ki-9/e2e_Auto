import { expect } from '@playwright/test';
import { BaseCDMSPage, ModifyReason } from '../common/BaseCDMSPage';
import { getLabel } from '../../common/LanguageConfig';

export class AEPage extends BaseCDMSPage {

  // AE 페이지로 이동
  async navigateToAEPage(): Promise<void> {
    await this.page.getByRole('button', { name: 'ALL' }).click();
    await this.page.getByRole('link', { name: 'Adverse Event' }).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // 체크박스 미체크 시 체크 처리
  async checkLabelIfUnchecked(label: string): Promise<void> {
    const checkbox = this.page
      .locator('label')
      .filter({ hasText: label })
      .locator('div')
      .first();
    if (!(await checkbox.isChecked())) {
      await checkbox.click();
    }
  }

  // AE 새 행 추가
  async addNewAERow(): Promise<void> {
    await this.page.locator('tfoot').getByTestId('button').click();
  }

  // Foldable Table 펼치기
  async expandAERow(): Promise<void> {
    await this.page.getByRole('cell', { name: '[Adverse Event Term]' }).click();
  }

  // AE Term 입력
  async fillAETerm(term: string): Promise<void> {
    await this.page.getByText('[Adverse Event Term]').nth(1).click();
    await this.page
      .locator("[class='input-box'] > div > div > div > div > input")
      .fill(term);
    await this.page.getByText('Enter').click();
  }

  // SAE Seriousness 설정 (Yes 선택)
  async setSAESeriousness(): Promise<void> {
    await this.page.getByText('Yes²⁾').nth(1).click();
  }

  // AESI Seriousness(No) 및 AESI 조건 설정
  async setAESISeriousnessAndCondition(): Promise<void> {
    await this.page.getByText('Yes²⁾No').nth(2).locator('label').nth(1).click();
    await this.page.getByText('Yes¹⁾No').locator('label').nth(0).click();
  }

  // AE 저장 — Initial/Modified 상태 자동 감지
  async saveAEWithConfirm(): Promise<void> {
    await this.page
      .getByRole('button', { name: getLabel('save', 'en'), exact: true })
      .click();

    const isModified = await this.page
      .getByText('Modification Reason')
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isModified) {
      await this.page.getByText('New Data').click();
      await this.page
        .getByRole('button', { name: getLabel('save', 'en'), exact: true })
        .click();
    }

    await this.page
      .getByRole('button', { name: getLabel('confirm', this.lang), exact: true })
      .click();
    await expect(this.page.locator('.fx-notification.--succ')).toBeVisible();
    await this.page.locator('.fx-notification .close').click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // AE 수정 저장 — 항상 수정사유 선택
  async modifySaveAEWithReason(reason: ModifyReason = 'New Data'): Promise<void> {
    await this.page
      .getByRole('button', { name: getLabel('save', 'en'), exact: true })
      .click();
    await this.page.getByText(reason).click();
    await this.page
      .getByRole('button', { name: getLabel('save', 'en'), exact: true })
      .click();
    await this.page
      .getByRole('button', { name: getLabel('confirm', this.lang), exact: true })
      .click();
    await expect(this.page.locator('.fx-notification.--succ')).toBeVisible();
    await this.page.locator('.fx-notification .close').click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // AE Term 텍스트를 가진 셀 노출 확인 (CRF 페이지 이동 후)
  async verifyAETermCellVisible(term: string): Promise<void> {
    await expect(
      this.page.getByRole('cell', { name: term })
    ).toBeVisible({ timeout: 10000 });
  }

  // AE Term으로 행을 탐색하여 Delete 아이콘 클릭 → targetAeSeq 반환
  async deleteAERowByTerm(term: string): Promise<number> {
    const rows = this.page.locator('.item-foldable-table-summary-row');
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const cellCount = await rows.nth(i).locator('> *').count();
      for (let j = 0; j < cellCount; j++) {
        if ((await rows.nth(i).locator('> *').nth(j).innerText()) === term) {
          await rows
            .nth(i)
            .locator('[aria-label="Remove Row(strikeout)"]')
            .click();
          return i;
        }
      }
    }
    throw new Error(`'${term}' 텍스트를 포함한 AE 행을 찾을 수 없습니다.`);
  }

  // 특정 인덱스의 AE 행 --strike 클래스 여부 확인
  async verifyAERowStrikeStatus(targetAeSeq: number, hasStrike: boolean): Promise<void> {
    const rowClass = await this.page
      .locator('.item-foldable-table-summary-row')
      .nth(targetAeSeq)
      .getAttribute('class');
    expect(rowClass?.includes('--strike')).toBe(hasStrike);
  }

  // 특정 인덱스의 AE 행에서 복원 아이콘 클릭 (Delete 아이콘과 동일 위치)
  async restoreAERowByIndex(targetAeSeq: number): Promise<void> {
    await this.page
      .locator('.item-foldable-table-summary-row')
      .nth(targetAeSeq)
      .locator('[aria-label="Restore Row"]')
      .click();
  }

  // 특정 인덱스의 AE 행에서 Report 아이콘 클릭
  async clickReportIconOnAERow(targetAeSeq: number): Promise<void> {
    await this.page
      .locator('.item-foldable-table-summary-row')
      .nth(targetAeSeq)
      .locator('[aria-label="View SAE Report"]')
      .click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}