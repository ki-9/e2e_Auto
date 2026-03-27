import { expect } from '@playwright/test';
import { BaseCDMSPage } from '../common/BaseCDMSPage';

export class SubjectPage extends BaseCDMSPage {

  // Subject 추가 폼 열기
  async openAddSubjectForm(): Promise<void> {
    await this.page.getByRole('button', { name: 'Add Subject', exact: true }).click();
    await this.page.locator('.MuiList-root').waitFor({ state: 'visible' });
    await this.page.locator('.MuiList-root').getByText('Subject', { exact: true }).click();
  }

  // Subject 기본 정보 입력
  async fillSubjectForm(): Promise<void> {
    await this.setItemSingleSelectRadio('서면 동의 여부', '예');
    await this.setItemDateField('동의서 서명일', 2);
  }

  // Subject 저장
  async saveSubject(): Promise<void> {
    await this.clickSave();
  }

  // 성공 토스트 확인
  async verifySuccessToast(): Promise<void> {
    await expect(this.page.locator('.fx-notification.--succ')).toBeVisible();
  }

  // Subject 생성 후 Schedule 페이지 이동 확인
  async verifySubjectPage(): Promise<void> {
    await expect(
      this.page.locator('[class*="app-study-subject-crf-schedule"]')
    ).toBeVisible();
  }

  // Subject ID 반환
  async getSubjectId(): Promise<string> {
    return this.getSegmentAfter('subjects');
  }  
}