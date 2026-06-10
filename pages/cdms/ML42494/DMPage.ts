import { expect } from '@playwright/test';
import { BaseCDMSPage } from '../common/BaseCDMSPage';

export class DMPage extends BaseCDMSPage {
    // Subject 메뉴 → 첫 번째 Subject → DM 페이지 이동
    async navigateToDMPage(): Promise<void> {
        await this.navigateToSubject();
        await this.page
        .locator("[data-selection-index='0'] [role='gridcell'] a")
        .first()
        .click();
        await this.page.waitForLoadState('domcontentloaded');
        await this.scrollToVisit('ALL');
        await this.goToCrfPage('ALL', "Patient's Baseline Information");
        await expect(this.page).toHaveURL(/\/AV\/DM\/1\/DM\/1/);
    }
    
    // DM 페이지 데이터 입력 (Sex, Birth date, Height, Weight)
    async fillDMData(sex: string, height: string, weight: string): Promise<void> {
        await this.setItemSingleSelectRadio('Sex', sex);

        await this.page.locator("[class='cr-calendar-input'] input").first().click();
        await this.page.waitForSelector("[class*='is-active']");
        await this.page.getByRole('button', { name: 'Enter' }).click();

        // Date 입력 후 필드 활성화 대기
        await this.page.locator("tr [class*='ms-TextField']").nth(9).waitFor();
        await expect(
        this.page.locator("tr [class*='ms-TextField']").nth(9)
        ).not.toHaveClass(/disabled/, { timeout: 5000 });

        await this.page.locator("tr [type='text']").nth(2).fill(height);
        await this.page.locator("tr [type='text']").nth(3).fill(weight);
    }
}