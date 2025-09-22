// tests/global-setup.ts
import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Maven Clinical RTSM 테스트 시작');
  console.log('📋 테스트 설정:');
  console.log(`   - 베이스 URL: ${config.use?.baseURL}`);
  console.log(`   - 브라우저: ${config.projects?.map(p => p.name).join(', ')}`);
  console.log(`   - 워커 수: ${config.workers}`);
  console.log(`   - 재시도 횟수: ${config.retries}`);
  
  // 여기에 전역 설정이 필요한 경우 추가
  // 예: 데이터베이스 초기화, 테스트 데이터 준비 등
}

export default globalSetup;