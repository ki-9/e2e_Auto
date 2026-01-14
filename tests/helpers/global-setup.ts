// tests/global-setup.ts
import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Maven Clinical RTSM 테스트 시작');
  
  // 모든 프로젝트의 설정 확인
  const projects = config.projects || [];
  const browsers = projects.map(p => p.name).join(', ');
  const baseURLs = projects
    .map(p => p.use?.baseURL)
    .filter(Boolean)
    .join(', ');
  
  console.log(`   - 브라우저: ${browsers}`);
  console.log(`   - 베이스 URL: ${baseURLs}`);
  console.log(`   - 워커 수: ${config.workers}`);
}

export default globalSetup;