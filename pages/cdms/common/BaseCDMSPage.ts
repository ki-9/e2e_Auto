import { Page, Locator } from '@playwright/test';
import dayjs from 'dayjs';
import { Language, getLabel } from '../../common/LanguageConfig';

export type ModifyReason = 'New Data' | 'Input Error' | 'Modified Data' | 'Others';
export class BaseCDMSPage {
  constructor(
    protected page: Page,
    protected lang: Language = 'en'  // 기본값 영어
  ) {}

  // afterEach에서 page 접근용
  getPage(): Page {
    return this.page;
  }

  ////// Single Select Item //////
  protected getItemSingleSelectLocator(label: string): Locator {
    return this.page.locator(`td:text-is('${label}') + td`);
  }

  protected getItemSingleSelectRadio(label: string, text: string): Locator {
    return this.getItemSingleSelectLocator(label)
      .locator(`label:has-text('${text}')`)
      .locator('..')
      .locator("input[type='checkbox']");
  }
  
  async setItemSingleSelectRadio(label: string, text: string): Promise<void> {
    const itemSingleSelect = this.getItemSingleSelectLocator(label)
      .getByText(text, { exact: true });
    await itemSingleSelect.click();
  }
  ////////////////////////////////

  ////// Date Item //////
  protected getItemDateFieldLocator(label: string, nth: number = 0): Locator {
    return this.page.locator(`td:text-is("${label}") + td`).nth(nth);
  }

  protected async selectDateItem(dateItem: Locator, day: number): Promise<void> {
    const todayDate = dayjs().date();
    const value = todayDate <= day ? `${todayDate} TODAY` : day;

    await dateItem.locator("input[type='text']").click();
    await this.page
      .locator('.cr-calendar-dates')
      .getByRole('button', { name: String(value), exact: true })
      .first()
      .click();
  }

  async setItemDateField(label: string, day: number, nth: number = 0): Promise<void> {
    const dateItem = this.getItemDateFieldLocator(label, nth);
    await this.selectDateItem(dateItem, day);
  }
  ////////////////////////

  getSegmentAfter(keyword: string): string {
    const segments = new URL(this.page.url()).pathname.split('/').filter(Boolean);
    const index = segments.indexOf(keyword);
    return index !== -1 ? segments[index + 1] ?? '' : '';
  }

  async clickSave(): Promise<void> {
    await this.page.getByRole('button', { name: getLabel('save', 'en'), exact: true }).click();
    await this.page.waitForResponse(
      resp =>
        resp.url().includes('/subjects/summary?type=SUBJECT') &&
        resp.status() === 200
    );
    await this.page.waitForTimeout(500);
  }

  async clickConfirmSave(): Promise<void> {
    await this.page.getByRole('button', { name: getLabel('save', 'en'), exact: true }).click();
    await this.page.waitForTimeout(500);
  }

  async clickSaveAndNext(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save & Next', exact: true }).click();
    await this.page.waitForResponse(
      resp =>
        resp.url().includes('/subjects/summary?type=SUBJECT') &&
        resp.status() === 200
    );
    await this.page.waitForTimeout(500);
  }

  async clickModifySaveButton(reason: ModifyReason, othersText?: string): Promise<void> {
    await this.page.getByRole('button', { name: getLabel('save', 'en'), exact: true }).click();
    await this.page.getByRole('radiogroup').getByText(reason).click();
    if (reason === 'Others' && othersText) {
      await this.page.getByRole('radiogroup').locator('input[type="text"]').fill(othersText);
    }
    await this.page.getByRole('button', { name: getLabel('save', 'en'), exact: true }).last().click();
    await this.page.waitForResponse(
      resp =>
        resp.url().includes('/subjects/summary?type=SUBJECT') &&
        resp.status() === 200
    );
    await this.page.waitForTimeout(500);
  }

  async clickConfirmModifySaveButton(reason: ModifyReason, othersText?: string): Promise<void> {
    await this.page.getByRole('button', { name: getLabel('save', 'en'), exact: true }).click();
    await this.page.getByRole('radiogroup').getByText(reason).click();
    if (reason === 'Others' && othersText) {
      await this.page.getByRole('radiogroup').locator('input[type="text"]').fill(othersText);
    }
    await this.page.getByRole('button', { name: getLabel('save', 'en'), exact: true }).last().click();
    await this.page.waitForTimeout(500);
  }

  async clickConfirm(): Promise<void> {
    await this.page.locator(`button:has-text("${getLabel('confirm', this.lang)}")`).click();
  }

  async clickClose(): Promise<void> {
    await this.page.locator(`button:has-text("${getLabel('close', this.lang)}")`).click();
  }

  // Subject 메뉴로 이동
  async navigateToSubject(): Promise<void> {
    await this.page.getByRole('link', { name: 'Subject', exact: true }).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // Visit 탐색 및 스크롤
  async scrollToVisit(visitName: string): Promise<void> {
    await this.page
      .locator(`button:has-text('${visitName}')`)
      .scrollIntoViewIfNeeded();
  }

  // CRF 페이지 활성화
  async activateCrf(): Promise<void> {
    if(await this.page.getByRole('button', { name: 'Activate CRF' }).isVisible({timeout: 1000})) {
      await this.page
        .getByRole('button', { name: 'Activate CRF' })
        .click();
      await this.page.waitForResponse(
        resp =>
          resp.url().includes('/subjects/summary?type=SUBJECT') &&
          resp.status() === 200
      );
      await this.page.waitForTimeout(500);
    } else {
      console.log("이미 활성화 된 페이지");
    }
  }

  // CRF 페이지로 이동
  async goToCrfPage(visitName: string, pageName: string): Promise<void> {
    const visitButton = this.page.locator(`button:has-text('${visitName}')`);

    const isExpanded = await visitButton.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await visitButton.click();
    }
    await this.page.getByRole('link', { name: pageName }).click();
    await this.page.waitForResponse(
      resp =>
        resp.url().includes('/subjects/summary?type=SUBJECT') &&
        resp.status() === 200
    );
    await this.page.waitForTimeout(500);
  }

  // 특정 페이지가 사이드바에서 활성화될 때까지 대기
  async waitForIEPageActive(pageName: string): Promise<void> {
    await this.page.waitForFunction((name) => {
      const elements = Array.from(document.querySelectorAll('.cr-nav-wrapped'));
      return elements.some(el =>
        el.textContent?.includes(name) &&
        !el.classList.contains('--is-not-available')
      );
    }, pageName);
  }
}