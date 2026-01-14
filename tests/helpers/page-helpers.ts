// tests/helpers/page-helpers.ts
import { Page, expect, Locator } from '@playwright/test';

/**
 * 페이지 로딩 관련 헬퍼 함수들
 */
export class PageHelpers {
  constructor(private page: Page) {}

  /**
   * 페이지가 완전히 로드될 때까지 대기
   */
  async waitForPageLoad(timeout: number = 30000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
    await this.page.waitForLoadState('domcontentloaded', { timeout });
  }

  /**
   * 요소가 나타날 때까지 대기
   */
  async waitForElement(selector: string, timeout: number = 10000): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  /**
   * 요소가 사라질 때까지 대기
   */
  async waitForElementToDisappear(selector: string, timeout: number = 10000): Promise<void> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'hidden', timeout });
  }

  /**
   * 텍스트가 포함된 요소 찾기
   */
  async findByText(text: string, options: { exact?: boolean; timeout?: number } = {}): Promise<Locator> {
    const { exact = false, timeout = 10000 } = options;
    const selector = exact ? `text="${text}"` : `text=${text}`;
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  /**
   * 여러 선택자 중 하나라도 나타날 때까지 대기
   */
  async waitForAnySelector(selectors: string[], timeout: number = 10000): Promise<string> {
    const promises = selectors.map(selector => 
      this.page.locator(selector).waitFor({ state: 'visible', timeout }).then(() => selector)
    );
    
    return Promise.race(promises);
  }

  /**
   * 스크롤해서 요소를 뷰포트에 표시
   */
  async scrollToElement(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded();
  }

  /**
   * 안전한 클릭 (요소가 준비될 때까지 대기 후 클릭)
   */
  async safeClick(selector: string, timeout: number = 10000): Promise<void> {
    const element = await this.waitForElement(selector, timeout);
    await element.click();
  }

  /**
   * 안전한 입력 (요소 클리어 후 입력)
   */
  async safeFill(selector: string, value: string, timeout: number = 10000): Promise<void> {
    const element = await this.waitForElement(selector, timeout);
    await element.clear();
    await element.fill(value);
  }

  /**
   * 드롭다운 선택
   */
  async selectOption(selector: string, value: string, timeout: number = 10000): Promise<void> {
    const element = await this.waitForElement(selector, timeout);
    await element.selectOption(value);
  }

  /**
   * 체크박스 상태 설정
   */
  async setCheckbox(selector: string, checked: boolean, timeout: number = 10000): Promise<void> {
    const element = await this.waitForElement(selector, timeout);
    await element.setChecked(checked);
  }

  /**
   * 현재 URL 확인
   */
  async verifyURL(pattern: string | RegExp): Promise<void> {
    if (typeof pattern === 'string') {
      await expect(this.page).toHaveURL(pattern);
    } else {
      await expect(this.page).toHaveURL(pattern);
    }
  }

  /**
   * 페이지 제목 확인
   */
  async verifyTitle(pattern: string | RegExp): Promise<void> {
    if (typeof pattern === 'string') {
      await expect(this.page).toHaveTitle(pattern);
    } else {
      await expect(this.page).toHaveTitle(pattern);
    }
  }

  /**
   * 로딩 스피너 대기
   */
  async waitForLoadingToComplete(loadingSelector: string = '[data-testid="loading"], .loading, .spinner', timeout: number = 30000): Promise<void> {
    try {
      const loadingElement = this.page.locator(loadingSelector);
      await loadingElement.waitFor({ state: 'visible', timeout: 3000 });
      await loadingElement.waitFor({ state: 'hidden', timeout });
    } catch (error) {
      // 로딩 요소가 없는 경우는 정상적인 상황으로 처리
    }
  }

  /**
   * 로그인 성공 확인
   * - URL이 로그인 페이지가 아닌지 확인
   * - 대시보드나 메인 페이지 요소 확인
   */
  async verifyLoginSuccess(timeout: number = 30000): Promise<void> {
    // 페이지 로딩 완료 대기
    await this.waitForPageLoad(timeout);
    
    // URL이 로그인 관련 페이지가 아닌지 확인
    await expect(this.page).not.toHaveURL(/.*login.*|.*sign-in.*|.*auth.*\/sign-in.*/i);
    
    // 기본적으로 body 요소가 존재하는지 확인
    await expect(this.page.locator('body')).toBeVisible();
    
    // 일반적인 로그인 후 요소들 확인 (하나라도 있으면 성공으로 간주)
    const postLoginSelectors = [
      '[data-testid="user-menu"]',     // 사용자 메뉴
      '.user-menu',                    // 사용자 메뉴 클래스
      'text=Dashboard',                // 대시보드
      'text=대시보드',                  // 한글 대시보드
      'text=Home',                     // 홈
      'text=Study',                    // 스터디
    ];
    
    try {
      const foundSelector = await this.waitForAnySelector(postLoginSelectors, 10000);
    } catch (error) {
      // 위의 요소들을 찾지 못한 경우, 현재 페이지 상태 로깅
      const currentUrl = this.page.url();
      const pageTitle = await this.page.title();
      const pageContent = await this.getPageText();
      
      console.log(`현재 URL: ${currentUrl}`);
      console.log(`페이지 제목: ${pageTitle}`);
      console.log(`페이지 내용 미리보기: ${pageContent.substring(0, 300)}`);
      
      // URL이 로그인 페이지가 아니라면 성공으로 간주 (기본 검증)
      if (!currentUrl.match(/.*login.*|.*sign-in.*|.*auth.*\/sign-in.*/i)) {
        return;
      }
    }
  }

  /**
   * 테이블 로딩 대기
   * - 테이블 요소가 나타날 때까지 대기
   * - 테이블 내용이 로드될 때까지 대기
   */
  async waitForTableLoading(tableSelector: string = 'table', timeout: number = 30000): Promise<void> {
    console.log('테이블 로딩 대기 중...');
    
    // 기본 테이블 선택자들
    const tableSelectorVariants = [
      tableSelector,
      'table',
      '[role="table"]',
      '.table',
      '[data-testid="table"]',
      '.data-table',
      '.grid',
      '[role="grid"]'
    ];
    
    try {
      // 테이블 요소가 나타날 때까지 대기
      const foundTableSelector = await this.waitForAnySelector(tableSelectorVariants, timeout);
      
      const table = this.page.locator(foundTableSelector);
      
      // 테이블이 실제로 보이는지 확인
      await expect(table).toBeVisible();
      
      // 테이블 내용 로딩 대기 (행이 있는지 확인)
      const rowSelectors = [
        `${foundTableSelector} tr`,
        `${foundTableSelector} tbody tr`,
        `${foundTableSelector} [role="row"]`
      ];
      
      for (const rowSelector of rowSelectors) {
        try {
          const rows = this.page.locator(rowSelector);
          const rowCount = await rows.count();
          
          if (rowCount > 0) {           
            // 첫 번째 행이 실제 데이터인지 확인 (헤더가 아닌)
            const firstRowText = await rows.first().textContent();
            if (firstRowText && firstRowText.trim().length > 0) {
              console.log(`첫 번째 행 내용: ${firstRowText.substring(0, 100)}`);
            }
            
            return;
          }
        } catch (error) {
          // 현재 행 선택자로 찾지 못한 경우 다음 선택자 시도
          continue;
        }
      }
      
      // 행을 찾지 못한 경우에도 테이블 자체는 존재하므로 경고만 출력
      console.log('⚠️ 테이블은 존재하지만 데이터 행을 찾을 수 없습니다.');
      
    } catch (error) {
      // 테이블을 전혀 찾지 못한 경우
      throw new Error(`테이블을 찾을 수 없습니다: ${error}`);
    }
  }

  /**
   * 특정 텍스트가 포함된 테이블 행 찾기
   */
  async findTableRowByText(text: string, tableSelector: string = 'table'): Promise<Locator | null> {
    await this.waitForTableLoading(tableSelector);
    
    const rows = this.page.locator(`${tableSelector} tr, ${tableSelector} [role="row"]`);
    const rowCount = await rows.count();
    
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const rowText = await row.textContent();
      
      if (rowText && rowText.includes(text)) {
        return row;
      }
    }
    
    return null;
  }

  /**
   * 테이블 데이터 추출
   */
  async extractTableData(tableSelector: string = 'table'): Promise<string[][]> {
    await this.waitForTableLoading(tableSelector);
    
    const rows = this.page.locator(`${tableSelector} tr, ${tableSelector} [role="row"]`);
    const rowCount = await rows.count();
    const tableData: string[][] = [];
    
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const cells = row.locator('td, th, [role="cell"], [role="columnheader"]');
      const cellCount = await cells.count();
      const rowData: string[] = [];
      
      for (let j = 0; j < cellCount; j++) {
        const cellText = await cells.nth(j).textContent();
        rowData.push(cellText?.trim() || '');
      }
      
      if (rowData.length > 0) {
        tableData.push(rowData);
      }
    }
    
    return tableData;
  }

  /**
   * 에러 메시지 확인
   */
  async checkForErrors(errorSelectors: string[] = ['.error', '.alert-danger', '[role="alert"]']): Promise<string[]> {
    const errors: string[] = [];
    
    for (const selector of errorSelectors) {
      const errorElements = this.page.locator(selector);
      const count = await errorElements.count();
      
      for (let i = 0; i < count; i++) {
        const text = await errorElements.nth(i).textContent();
        if (text && text.trim()) {
          errors.push(text.trim());
        }
      }
    }
    
    return errors;
  }

  /**
   * 페이지 스크린샷 찍기
   */
  async takeScreenshot(name: string, fullPage: boolean = false): Promise<void> {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage 
    });
  }

  /**
   * 브라우저 콘솔 로그 수집
   */
  async getConsoleLogs(): Promise<string[]> {
    const logs: string[] = [];
    
    this.page.on('console', (msg) => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    return logs;
  }

  /**
   * 네트워크 요청 모니터링
   */
  async monitorNetworkRequests(urlPattern?: string | RegExp): Promise<void> {
    this.page.on('request', (request) => {
      if (!urlPattern || request.url().match(urlPattern)) {
        console.log(`Request: ${request.method()} ${request.url()}`);
      }
    });

    this.page.on('response', (response) => {
      if (!urlPattern || response.url().match(urlPattern)) {
        console.log(`Response: ${response.status()} ${response.url()}`);
      }
    });
  }

  /**
   * 쿠키 설정
   */
  async setCookie(name: string, value: string, domain?: string): Promise<void> {
    await this.page.context().addCookies([{
      name,
      value,
      domain: domain || new URL(this.page.url()).hostname,
      path: '/'
    }]);
  }

  /**
   * 쿠키 가져오기
   */
  async getCookie(name: string): Promise<string | undefined> {
    const cookies = await this.page.context().cookies();
    const cookie = cookies.find(c => c.name === name);
    return cookie?.value;
  }

  /**
   * 로컬 스토리지 설정
   */
  async setLocalStorage(key: string, value: string): Promise<void> {
    await this.page.evaluate(({ key, value }) => {
      localStorage.setItem(key, value);
    }, { key, value });
  }

  /**
   * 로컬 스토리지 가져오기
   */
  async getLocalStorage(key: string): Promise<string | null> {
    return await this.page.evaluate((key) => {
      return localStorage.getItem(key);
    }, key);
  }

  /**
   * 현재 페이지의 모든 텍스트 가져오기
   */
  async getPageText(): Promise<string> {
    return await this.page.textContent('body') || '';
  }

  /**
   * 사용자 메뉴 클릭 (사용자명에 의존하지 않는 방식)
   */
  async clickUserMenu(): Promise<void> {
    console.log('사용자 메뉴 클릭 시도 중...');
    
    // 사용자 메뉴 버튼을 찾기 위한 다양한 선택자들
    const userMenuSelectors = [
      // 1. 상단 우측 사용자 버튼 (드롭다운 아이콘이 있는)
      '.css-unzqs5 button.GrButton:has(.GrIcon)',
      
      // 2. 사용자명이 포함된 버튼 (GrButton-content 클래스 사용)
      'button.GrButton:has(.GrButton-content):not(:has(text=한국어)):not(:has(text=57:)):not(:has(text=시간))',

    ];
    
    let clicked = false;
    
    for (const selector of userMenuSelectors) {
      try {
        const element = this.page.locator(selector);
        const count = await element.count();
        
        if (count > 0) {
          // 요소가 실제로 보이는지 확인
          const isVisible = await element.first().isVisible();
          if (isVisible) {
            console.log(`사용자 메뉴 버튼 발견: ${selector}`);
            
            // 버튼의 텍스트 내용 확인 (디버깅용)
            const buttonText = await element.first().textContent();
            console.log(`버튼 텍스트: ${buttonText}`);
            
            await element.first().click();
            clicked = true;
            break;
          }
        }
      } catch (error) {
        // 현재 선택자로 클릭 실패시 다음 선택자 시도
        continue;
      }
    }
    
    if (!clicked) {
      // 모든 선택자 실패
      throw new Error('사용자 메뉴 버튼을 찾을 수 없습니다.');
    }
  }

  /**
   * 로그아웃 버튼 클릭
   */
  async clickLogoutButton(): Promise<void> {
    // 로그아웃 버튼을 찾기 위한 선택자들
    const logoutSelectors = [
      'text=로그아웃',
      'text=Logout', 
      'text=Sign Out',
      'button:has-text("로그아웃")',
      'button:has-text("Logout")',
      'a:has-text("로그아웃")',
      'a:has-text("Logout")',
      '[role="menuitem"]:has-text("로그아웃")',
      '[role="menuitem"]:has-text("Logout")'
    ];
    
    let clicked = false;
    
    for (const selector of logoutSelectors) {
      try {
        const element = this.page.locator(selector);
        const count = await element.count();
        
        if (count > 0) {
          const isVisible = await element.first().isVisible();
          if (isVisible) {
            await element.first().click();
            clicked = true;
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!clicked) {  
      // 드롭다운 메뉴가 나타났는지 확인
      const dropdownContent = await this.page.textContent('body');
      console.log('현재 페이지 내용:', dropdownContent?.substring(0, 300));
      
      throw new Error('로그아웃 버튼을 찾을 수 없습니다.');
    }
  }

  /**
   * 완전한 로그아웃 프로세스 (사용자명에 의존하지 않음)
   */
  async performLogout(): Promise<void> {
    try {
      // 1. 사용자 메뉴 클릭
      await this.clickUserMenu();
      
      // 2. 드롭다운 메뉴가 나타날 때까지 잠시 대기
      await this.page.waitForTimeout(1000);
      
      // 3. 로그아웃 버튼 클릭
      await this.clickLogoutButton();
      
      // 4. 로그인 페이지로 리다이렉트 확인
      await this.page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

    } catch (error) {
      throw error;
    }
  }

  /**
   * 요소의 속성 가져오기
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    const element = this.page.locator(selector);
    return await element.getAttribute(attribute);
  }

  /**
   * 요소가 활성화되어 있는지 확인
   */
  async isEnabled(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    return await element.isEnabled();
  }

  /**
   * 요소가 체크되어 있는지 확인
   */
  async isChecked(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    return await element.isChecked();
  }

  /**
   * 요소가 보이는지 확인
   */
  async isVisible(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    return await element.isVisible();
  }

  /**
   * 키보드 단축키 입력
   */
  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * 키 조합 입력 (예: Ctrl+A)
   */
  async pressKeyCombination(keys: string[]): Promise<void> {
    const modifiers = keys.slice(0, -1);
    const lastKey = keys[keys.length - 1];
    
    for (const modifier of modifiers) {
      await this.page.keyboard.down(modifier);
    }
    
    await this.page.keyboard.press(lastKey);
    
    for (const modifier of modifiers.reverse()) {
      await this.page.keyboard.up(modifier);
    }
  }

  /**
   * 파일 업로드
   */
  async uploadFile(selector: string, filePath: string): Promise<void> {
    const fileInput = this.page.locator(selector);
    await fileInput.setInputFiles(filePath);
  }

  /**
   * 새 창/탭 처리
   */
  async handleNewTab(triggerAction: () => Promise<void>): Promise<Page> {
    const [newPage] = await Promise.all([
      this.page.waitForEvent('popup'),
      triggerAction()
    ]);
    
    return newPage;
  }

  /**
   * Alert 대화상자 처리
   */
  async handleAlert(accept: boolean = true): Promise<string> {
    let alertText = '';
    
    this.page.once('dialog', async (dialog) => {
      alertText = dialog.message();
      if (accept) {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });
    
    return alertText;
  }
}

/**
 * 정적 헬퍼 메서드들
 */
export class StaticPageHelpers {
  /**
   * 랜덤 문자열 생성
   */
  static generateRandomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 랜덤 이메일 생성
   */
  static generateRandomEmail(domain: string = 'example.com'): string {
    return `test${this.generateRandomString(8)}@${domain}`;
  }

  /**
   * 현재 날짜 문자열 생성
   */
  static getCurrentDateString(format: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' = 'YYYY-MM-DD'): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }

  /**
   * 지연 실행
   */
  static async wait(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * 재시도 로직
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts) {
          console.log(`시도 ${attempt} 실패, ${delay}ms 후 재시도...`);
          await this.wait(delay);
        }
      }
    }

    throw new Error(`${maxAttempts}번의 시도 후 실패: ${lastError!.message}`);
  }
}

// 기본 내보내기
export default PageHelpers;

/**
 * 기존 테스트 코드와의 호환성을 위한 독립적인 헬퍼 함수들
 */

/**
 * 로그인 성공 확인 (독립 함수)
 */
export async function verifyLoginSuccess(page: Page): Promise<void> {
  const helpers = new PageHelpers(page);
  await helpers.verifyLoginSuccess();
}

/**
 * 테이블 로딩 대기 (독립 함수)
 */
export async function waitForTableLoading(page: Page, tableSelector: string = 'table'): Promise<void> {
  const helpers = new PageHelpers(page);
  await helpers.waitForTableLoading(tableSelector);
}

/**
 * 완전한 로그아웃 프로세스 (독립 함수)
 */
export async function performLogout(page: Page): Promise<void> {
  const helpers = new PageHelpers(page);
  await helpers.performLogout();
}
export async function verifyDashboardFunctionality(page: Page): Promise<void> {
  const helpers = new PageHelpers(page);
  
  try {
    // RTSM Study 페이지의 특정 요소들 확인
    const studyElements = [
      'text=Study',                                         // 페이지 제목
      '.basic-table',                                       // 테이블 컨테이너
      '.table-thead',                                       // 테이블 헤더
      '.table-tbody',                                       // 테이블 바디
      'text=Protocol No.',                                  // 프로토콜 번호 컬럼
      'text=Study Name',                                    // 스터디명 컬럼
      'text=Env',                                          // 환경 컬럼
      'button:has-text("Ongoing")',                        // Ongoing 탭
      'button:has-text("Closed")',                         // Closed 탭
      '[role="tab"]'                                       // 탭 역할 요소
    ];
    
    // Study 관련 요소 중 하나라도 찾으면 성공
    try {
      const foundElement = await helpers.waitForAnySelector(studyElements, 10000);
      console.log(`Study 대시보드 요소 발견: ${foundElement}`);
    } catch (error) {
      // 요소를 찾지 못한 경우 페이지 상태 확인
      const pageContent = await helpers.getPageText();
      console.log(`페이지 내용 미리보기: ${pageContent.substring(0, 300)}`);
      
      // 사용자 이름이나 다른 로그인 후 요소가 있는지 확인
      if (pageContent.includes('Study') || 
          pageContent.includes('스터디') ||
          pageContent.includes('Protocol') ||
          pageContent.includes('Maven RTSM')) {
        return;
      }
      
      throw new Error('Study 대시보드 기능을 확인할 수 없습니다.');
    }
    
    // 테이블 로딩 시도
    try {
      await helpers.waitForTableLoading();
    } catch (error) {
      throw error;
    }
    
  } catch (error) {
    throw error;
  }
}