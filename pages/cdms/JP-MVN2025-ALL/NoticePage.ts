import { expect } from '@playwright/test';
import { BaseCDMSPage } from '../common/BaseCDMSPage';
import { getLabel } from '../../common/LanguageConfig';

export class NoticePage extends BaseCDMSPage {

  // Notice 탭으로 이동
  async navigateToNoticeTab(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Notice' }).click();
    await this.page.waitForSelector("[class*='basic-table']");
  }

  // 공지사항 생성
  async createNotice(title: string, content: string): Promise<void> {
    await this.page
      .getByRole('button', { name: getLabel('noticeAdd', this.lang) })
      .click();

    await expect(this.page.getByRole('button', { name: 'Undo' })).toBeVisible({ timeout: 10000 });
    await this.page.locator("div input").first().fill(title);
    await this.page.frameLocator('iframe.tox-edit-area__iframe').locator('body').fill(content);
    await this.page.getByText("Title").click();

    await this.page.getByRole('button', { name: getLabel('save', 'en') }).click();
    if(await this.page.getByRole('alert').isVisible()){
        await this.page.getByRole('alert').getByRole('button').click();
        console.log("저장 토스트 메시지 확인 후 닫음");
    }
    await this.page.waitForResponse(
      resp => resp.url().includes('/notices') && resp.status() === 200
    );
  }

  // 공지사항 목록에서 제목 확인
  async verifyNoticeVisible(title: string): Promise<void> {
    await this.page.waitForSelector('.basic-table', { state: 'visible' });
    await expect(
      this.page.locator('.basic-table').filter({ hasText: title })
    ).toBeVisible();
  }

  // 공지사항 목록에서 제목 미노출 확인
  async verifyNoticeNotVisible(title: string): Promise<void> {
    await expect(
      this.page.locator('.basic-table').getByText(title)
    ).toHaveCount(0);
  }

  // 공지사항 상세 진입
  async openNotice(title: string): Promise<void> {
    await this.page.getByRole('link', { name: title }).click();
  }

  // 공지사항 수정
  async editNotice(title: string, content: string): Promise<void> {
    await this.page
      .getByRole('button', { name: getLabel('edit', 'en') })
      .click();

    await this.page.waitForSelector('iframe.tox-edit-area__iframe', { state: 'visible' });
    await this.page.locator("div input").first().fill(title);
    await this.page
      .frameLocator('iframe.tox-edit-area__iframe')
      .locator('body')
      .fill(content);

    await this.page.getByRole('button', { name: getLabel('save', 'en') }).click();
    await this.page.waitForTimeout(1000);
    if(await this.page.getByRole('alert').isVisible()){
        await this.page.getByRole('alert').getByRole('button').click();
        console.log("저장 토스트 메시지 확인 후 닫음");
    }
    await this.page
      .getByRole('button', { name: getLabel('List', 'en') })
      .click();
    await this.page.waitForResponse(
      resp => resp.url().includes('/notices') && resp.status() === 200
    );
  }

  // 파일 업로드
  async uploadAttachment(filePath: string): Promise<void> {
    await this.page
      .getByRole('button', { name: getLabel('edit', 'en') })
      .click();
    await this.page.setInputFiles("input[type='file']", filePath);

    await this.page.getByRole('button', { name: getLabel('save', 'en') }).click();
    if(await this.page.getByRole('alert').isVisible()){
        await this.page.getByRole('alert').getByRole('button').click();
        console.log("저장 토스트 메시지 확인 후 닫음");
    }
    await this.page.waitForResponse(
      resp => resp.url().includes('/notices') && resp.status() === 200
    );
  }

  // 첨부파일명 확인
  async verifyAttachmentName(fileName: string): Promise<void> {
    await expect(
      this.page.locator("[type='Content.Body04']").nth(6)
    ).toHaveText(fileName);
  }

  // 공지사항 삭제
  async deleteNotice(title: string): Promise<void> {
    const rowLocator = this.page
      .locator(`text="${title}"`)
      .locator('xpath=ancestor::div[2]');
    await rowLocator.locator("input[type='checkbox']").click();

    await this.page
      .getByRole('button', { name: getLabel('delete', 'en') })
      .click();

    await this.page
      .locator('.GrDialog')
      .getByRole('button', { name: getLabel('deleteConfirm', this.lang) })
      .click();

    if(await this.page.getByRole('alert').isVisible()){
        await this.page.getByRole('alert').getByRole('button').click();
        console.log("삭제 토스트 메시지 확인 후 닫음");
    }

    await this.page.waitForResponse(
      resp => resp.url().includes('/notices') && resp.status() === 200
    );
  }
}