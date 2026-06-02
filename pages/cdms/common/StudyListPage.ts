import { Page } from '@playwright/test';
import { BaseCDMSPage } from './BaseCDMSPage';
import { CDMS_LOGIN_CONFIG } from '../../common/LoginPage';
import { Language } from '../../common/LanguageConfig';

export class StudyListPage extends BaseCDMSPage {
  constructor(page: Page, lang: Language = 'ko') {
    super(page, lang);
  }

  // 스터디 목록 페이지로 이동
  async navigate(): Promise<void> {
    const studyListUrl = `${CDMS_LOGIN_CONFIG.baseURL}/studies`;
    const currentUrl = this.page.url();

    if (currentUrl !== studyListUrl) {
      await this.page.goto(studyListUrl);
      await this.page.waitForResponse(
        resp => resp.url().includes('/studies/ongoing') && resp.status() === 200
      );
    }
  }

  // 프로토콜 번호로 스터디 검색 및 진입
  async selectStudy(protocolNo: string): Promise<void> {
    // 검색 버튼 클릭
    const searchButton = this.page.locator('div').filter({ hasText: /^Protocol No\.$/ }).getByRole('button');
    await searchButton.click();

    // 스터디 검색
    await this.page.getByRole('textbox').fill(protocolNo);
    await this.page.waitForTimeout(1000);
    await this.page.getByRole('button', { name: 'Search' }).click();

    // 검색 결과 클릭
    await this.page.getByText(protocolNo).waitFor();
    await this.page.getByRole('link', { name: protocolNo, exact: true }).click();
    await this.page.waitForLoadState('networkidle');
  }
}