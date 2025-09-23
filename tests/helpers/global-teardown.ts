// tests/global-teardown.ts
import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🏁 Maven Clinical RTSM 테스트 완료');
  console.log('📊 테스트 결과는 test-results/ 폴더에서 확인할 수 있습니다.');
  console.log('📱 HTML 리포트를 보려면 "npm run report" 명령을 실행하세요.');
  
  // 여기에 전역 정리가 필요한 경우 추가
  // 예: 임시 파일 삭제, 데이터베이스 정리 등
}

export default globalTeardown;