// pages/cdms/common/SubjectListPage.ts
import { BaseCDMSPage } from './BaseCDMSPage';
import { Language } from '../../common/LanguageConfig';
import { Page } from '@playwright/test';
import { CDMS_LOGIN_CONFIG } from '../../common/LoginPage';

export class SubjectListPage extends BaseCDMSPage {
  constructor(page: Page, lang: Language = 'en') {
    super(page, lang);
  }

  // Subject 목록 페이지로 이동
  async navigate(): Promise<void> {
    const currentUrl = this.page.url();
    // URL에서 studyId 추출 (/s/{studyId}/... 구조)
    const studyId = this.getSegmentAfter('s');
    const subjectListUrl = `${CDMS_LOGIN_CONFIG.baseURL}/s/${studyId}/subjects`;

    if (currentUrl !== subjectListUrl) {
      await this.page.goto(subjectListUrl);
      await this.page.waitForResponse(
        resp => resp.url().includes('/subjects') && resp.status() === 200
      );
    }
  }

  // Subject ID로 검색 및 진입
  async selectSubject(subjectId: string): Promise<void> {
    // 검색 버튼 클릭
    const searchButton = this.page.locator('span:has-text("Subject No.") + div');
    await searchButton.locator('button').click();

    // Subject 검색
    await this.page.locator('.ms-Callout').locator('input').fill(subjectId);
    await this.page.waitForTimeout(1000);
    await this.page.locator('.ms-Callout').locator('button').click();

    // 검색 결과 클릭
    await this.page.getByText(subjectId).waitFor();
    await this.page.getByRole('link', { name: subjectId, exact: true }).click();
    await this.page.waitForLoadState('networkidle');
  }

  // 최상단 Subject 진입
  async selectFirstSubject(): Promise<void> {
    if(await this.page.getByRole('grid').isVisible({ timeout: 3000 })) {
      // await this.page.locator("[data-list-index='0'] [data-automation-key='2'] [tabindex='-1']").click();
      await this.page.locator(".ms-List-page > :first-child").locator("a").click();
      await this.page.waitForLoadState('networkidle');
    } else {
      console.error("Subject 페이지 이동 실패");
    }
  }
}