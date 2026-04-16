import { Page } from '@playwright/test';
import { AccountCredentials } from '../../pages/common/LoginPage';

// 중복 로그인 팝업 처리 헬퍼 함수
export async function handleDuplicateLoginPopup(page: Page): Promise<boolean> {
  
  try {
    // 중복 로그인 관련 텍스트가 나타날 때까지 잠시 대기
    await page.waitForTimeout(2000);
    
    // 다양한 방법으로 중복 로그인 메시지 확인
    const duplicateLoginSelectors = [
      'text=해당 계정으로 이미 로그인 한 사용자가 있습니다',
      'text=이미 로그인 한 사용자가 있습니다',
      'text=이전 로그인 사용자의 접속을 끊고',
      'text=계속 진행하시겠습니까'
    ];
    
    let hasPopup = false;
    let foundSelector = '';
    
    // 각 셀렉터를 확인하여 팝업 존재 여부 판단
    for (const selector of duplicateLoginSelectors) {
      const isVisible = await page.locator(selector).isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        hasPopup = true;
        foundSelector = selector;
        break;
      }
    }
    
    // 텍스트 기반 확인도 추가
    if (!hasPopup) {
      const pageText = await page.textContent('body').catch(() => null);
      if (pageText) {
        const duplicateKeywords = [
          '해당 계정으로 이미 로그인',
          '이미 로그인 한 사용자',
          '이전 로그인 사용자의 접속을 끊고',
          'already logged in'
        ];
        
        hasPopup = duplicateKeywords.some(keyword => pageText.includes(keyword));
        if (hasPopup) {
          foundSelector = '텍스트 기반 감지';
        }
      }
    }
    
    if (hasPopup) {
      // Confirm 버튼 찾기 (다양한 방법으로)
      const confirmSelectors = [
        'button:has-text("Confirm")',
        'button:has-text("확인")',
        'button:has-text("OK")',
        'button:has-text("계속")',
        'button:has-text("Continue")'
      ];
      
      let confirmClicked = false;
      
      for (const confirmSelector of confirmSelectors) {
        try {
          const confirmButton = page.locator(confirmSelector);
          const isConfirmVisible = await confirmButton.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (isConfirmVisible) {
            await confirmButton.click();
            confirmClicked = true;
            break;
          }
        } catch (error) {
          // 다음 셀렉터 시도
          continue;
        }
      }
      
      if (!confirmClicked) {
        return false;
      }
      
      // 팝업이 사라질 때까지 대기
      await page.waitForTimeout(3000);      
      return true;
    } else {
      return false; // 팝업이 없었음을 의미
    }
    
  } catch (error) {
    return false;
  }
}

// Version & Release 팝업 닫기 함수 추가
export async function handleVersionReleasePopup(page: Page): Promise<boolean> {
  let closedCount = 0;

  while (true) {
    try {
      // 팝업이 나타날 때까지 대기 (없으면 timeout으로 빠져나옴)
      const popupVisible = await page
        .locator('[role="dialog"] [class="GrButton-content"]')
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      // 팝업이 없으면 반복 종료
      if (!popupVisible) break;

      const btn = page.locator('[role="dialog"] [class="GrButton-content"]');
      await btn.click();
      await page.waitForTimeout(500);
      closedCount++;

    } catch (error) {
      break;
    }
  }

  if (closedCount > 0) {
    console.log(`팝업 ${closedCount}개 처리 완료`);
    return true;
  }

  return false;
}

// 로그인 헬퍼 함수 (중복 로그인 팝업 처리 포함)
export async function performLogin(
  page: Page,
  account: AccountCredentials
): Promise<void> {
  // 이메일 입력
  const emailSelector = 'input[name="email"], input[type="email"], #email';
  await page.waitForSelector(emailSelector);
  await page.fill(emailSelector, account.email);

  // 패스워드 입력
  const passwordSelector = 'input[name="password"], input[type="password"], #password';
  await page.fill(passwordSelector, account.password);

  // 로그인 버튼 클릭
  const loginButtonSelector = 'button[type="submit"], input[type="submit"], button:has-text("로그인"), button:has-text("Login"), button:has-text("Sign In")';
  await page.click(loginButtonSelector);
  
  // 중복 로그인 팝업 처리
  const hadPopup = await handleDuplicateLoginPopup(page);
  
  if (hadPopup) {
    // 팝업 처리 후 추가 대기
    await page.waitForTimeout(1000);
  }

  const ReleasePopup = await handleVersionReleasePopup(page);

  if (ReleasePopup) {
    // 팝업 처리 후 추가 대기
    await page.waitForTimeout(1000);
  }
}