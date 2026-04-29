import { Page } from '@playwright/test';
import { performLogin } from '../../tests/helpers/login-helpers';
import * as dotenv from 'dotenv';
dotenv.config();

// 계정 타입 분리
export interface AccountCredentials {
  email: string;
  password: string;
  role: string;
  name: string;
}

// 공통 설정 (제품 무관)
export interface CommonLoginConfig {
  timeout: number;
  accounts: {
    [role: string]: AccountCredentials;
  };
}

// 제품별 config = 공통 설정 + baseURL만 추가
export interface LoginConfig extends CommonLoginConfig {
  baseURL: string;
}

// 공통 설정을 한 곳에서 정의
const COMMON_CONFIG: CommonLoginConfig = {
  timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
  accounts: {
    admin: {
      email: process.env.TEST_EMAIL_ADMIN || '',
      password: process.env.TEST_PASSWORD_ADMIN || '',
      role: '',
      name: '',
    },
    owner: {
      email: process.env.TEST_EMAIL_OWNER || '',
      password: process.env.TEST_PASSWORD_OWNER || '',
      role: 'Owner',
      name: 'Auto Owner1',
    },
  },
};

// 제품별 config는 baseURL만 추가
export const RTSM_LOGIN_CONFIG: LoginConfig = {
  ...COMMON_CONFIG,
  baseURL: 'https://staging.rtsm.mavenclinical.com',
};

export const CDMS_LOGIN_CONFIG: LoginConfig = {
  ...COMMON_CONFIG,
  baseURL: 'https://staging-sbx.cdms.mavenclinical.com',
};

export class LoginPage {
  constructor(private page: Page, private config: LoginConfig) {}

  async navigate(): Promise<void> {
    await this.page.goto(this.config.baseURL, { waitUntil: 'networkidle' });
  }

  async loginWithDeviceKey(role: string = 'admin'): Promise<void> {
    const account = this.config.accounts[role];
    if (!account) throw new Error(`정의되지 않은 role입니다: ${role}`);

    await this.navigate();
    await performLogin(this.page, account);
  }
}