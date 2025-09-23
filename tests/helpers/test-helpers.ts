import { Page, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

// 테스트 설정 상수
export const TEST_CONFIG = {
  baseURL: process.env.TEST_BASE_URL || 'https://staging.rtsm.mavenclinical.com',
  credentials: {
    email: process.env.TEST_EMAIL || '',
    password: process.env.TEST_PASSWORD || ''
  },
  deviceKey: process.env.TEST_DEVICE_KEY || '',
  timeout: parseInt(process.env.TEST_TIMEOUT || '30000')
};

// 환경 변수 검증 함수
export function validateEnvironmentVariables(): void {
  const requiredVars = [
    { key: 'TEST_EMAIL', value: TEST_CONFIG.credentials.email },
    { key: 'TEST_PASSWORD', value: TEST_CONFIG.credentials.password },
    { key: 'TEST_DEVICE_KEY', value: TEST_CONFIG.deviceKey }
  ];

  const missingVars = requiredVars.filter(({ value }) => !value);
  
  if (missingVars.length > 0) {
    const missingKeys = missingVars.map(({ key }) => key).join(', ');
    throw new Error(
      `필수 환경 변수가 설정되지 않았습니다: ${missingKeys}\n` +
      '.env 파일을 생성하고 필요한 값들을 설정해주세요.\n' +
      '.env.example 파일을 참고하세요.'
    );
  }
  
  console.log('✅ 모든 환경 변수가 올바르게 설정되었습니다.');
}

// 디바이스 키 설정 헬퍼 함수
export async function setDeviceAuthenticationKey(page: Page): Promise<void> {
  // JavaScript로 쿠키 직접 설정 (실제 도메인 자동 감지)
  await page.evaluate((deviceKey) => {
    // 도메인 없이 설정하는 것이 가장 효과적
    document.cookie = `cream:auth:device:key:staging=${deviceKey}; path=/; secure; samesite=lax`;
    console.log('디바이스 키 설정 완료:', document.cookie.includes('cream:auth:device:key:staging'));
  }, TEST_CONFIG.deviceKey);
  
  // 설정 확인
  const cookieSet = await page.evaluate(() => {
    return document.cookie.includes('cream:auth:device:key:staging');
  });
  
  if (!cookieSet) {
    throw new Error('디바이스 키 쿠키 설정 실패');
  }
  
  console.log('✅ 디바이스 인증 키가 성공적으로 설정되었습니다.');
}

// 중복 로그인 팝업 처리 헬퍼 함수
export async function handleDuplicateLoginPopup(page: Page): Promise<boolean> {
  console.log('🔍 중복 로그인 팝업 확인 중...');
  
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
      console.log('⚠️ 중복 로그인 팝업 발견됨');
      console.log(`📝 감지 방법: ${foundSelector}`);
      
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
            console.log(`✅ "${confirmSelector}" 버튼 클릭하여 중복 로그인 해결`);
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
        console.log('❌ 확인 버튼을 찾을 수 없습니다. 수동 처리가 필요할 수 있습니다.');
        return false;
      }
      
      // 팝업이 사라질 때까지 대기
      await page.waitForTimeout(3000);
      console.log('✅ 중복 로그인 팝업 처리 완료');
      
      return true;
    } else {
      console.log('✅ 중복 로그인 팝업 없음 - 정상 진행');
      return false; // 팝업이 없었음을 의미
    }
    
  } catch (error) {
    console.log('⚠️ 중복 로그인 팝업 처리 중 오류:', error.message);
    return false;
  }
}

// 로그인 헬퍼 함수 (중복 로그인 팝업 처리 포함)
export async function performLogin(page: Page): Promise<void> {
  // 이메일 입력
  const emailSelector = 'input[name="email"], input[type="email"], #email';
  await page.waitForSelector(emailSelector, { timeout: TEST_CONFIG.timeout });
  await page.fill(emailSelector, TEST_CONFIG.credentials.email);

  // 패스워드 입력
  const passwordSelector = 'input[name="password"], input[type="password"], #password';
  await page.fill(passwordSelector, TEST_CONFIG.credentials.password);

  // 로그인 버튼 클릭
  const loginButtonSelector = 'button[type="submit"], input[type="submit"], button:has-text("로그인"), button:has-text("Login"), button:has-text("Sign In")';
  await page.click(loginButtonSelector);
  
  // 중복 로그인 팝업 처리
  const hadPopup = await handleDuplicateLoginPopup(page);
  
  if (hadPopup) {
    console.log('✅ 중복 로그인 팝업 처리 완료');
    // 팝업 처리 후 추가 대기
    await page.waitForTimeout(2000);
  }
}