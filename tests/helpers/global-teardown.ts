// tests/global-teardown.ts
import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Maven Clinical RTSM 테스트 완료');
  
  // 여기에 전역 정리가 필요한 경우 추가
  // 예: 임시 파일 삭제, 데이터베이스 정리 등
}

export default globalTeardown;