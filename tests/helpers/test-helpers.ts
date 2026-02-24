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
    { key: 'TEST_EMAIL_ADMIN',      value: process.env.TEST_EMAIL_ADMIN },
    { key: 'TEST_PASSWORD_ADMIN',   value: process.env.TEST_PASSWORD_ADMIN },
    { key: 'TEST_DEVICE_KEY_ADMIN', value: process.env.TEST_DEVICE_KEY_ADMIN },
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
}