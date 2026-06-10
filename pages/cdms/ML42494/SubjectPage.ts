import { expect } from '@playwright/test';
import { BaseCDMSPage } from '../common/BaseCDMSPage';

export class SubjectPage extends BaseCDMSPage {

  // Subject 추가 폼 열기
  async openAddSubjectForm(): Promise<void> {
    await this.page.getByRole('link', { name: 'Subject', exact: true }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.getByRole('button', { name: 'Add Subject', exact: true }).click();
    await this.page.locator('.MuiList-root').waitFor({ state: 'visible' });
    await this.page.locator('.MuiList-root').getByText('Subject', { exact: true }).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // Subject 기본 정보 입력 (ML42494 전용)
  // TODO: setItemDateField는 day(일) 단위로 동작 — 원본의 20250723(YYYYMMDD) 방식과 다름. 날짜 입력 방식 확인 필요
  async fillSubjectForm(): Promise<void> {
    await this.setItemSingleSelectRadio(
      'Did the patient sign on Personal Information Collection and Usage Agreement?',
      'Yes'
    );
    await this.setItemDateField('Signed date', 23);
  }

  // 저장 후 Schedule 페이지 이동 확인
  async saveAndVerifySchedulePage(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save', exact: true }).click();
    await this.page.waitForResponse(
      resp => resp.url().includes('/subjects') && resp.status() === 200
    );
    await expect(this.page).toHaveURL(/s\/\d+\/subjects\/\d+/);
  }
}