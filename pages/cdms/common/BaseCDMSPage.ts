import { Page } from '@playwright/test';
import { Language, getLabel } from '../../common/LanguageConfig';

export class BaseCDMSPage {
  constructor(
    protected page: Page,
    protected lang: Language = 'ko'  // 기본값 한국어
  ) {}

  // 언어에 맞는 버튼 클릭
  async clickSave(): Promise<void> {
    await this.page.locator(`button:has-text("${getLabel('save', this.lang)}")`).click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickConfirm(): Promise<void> {
    await this.page.locator(`button:has-text("${getLabel('confirm', this.lang)}")`).click();
  }

  async clickClose(): Promise<void> {
    await this.page.locator(`button:has-text("${getLabel('close', this.lang)}")`).click();
  }
}