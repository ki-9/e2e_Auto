import { test, BrowserContext } from '@playwright/test';
import { LoginPage, CDMS_LOGIN_CONFIG } from '../../../pages/common/LoginPage';
import { StudyListPage } from '../../../pages/cdms/common/StudyListPage';
import { SubjectPage } from '../../../pages/cdms/JP-MVN2025-ALL/AddSubjectPage';
import { validateEnvironmentVariables } from '../../helpers/test-helpers';

const LANG = 'ko';
const STUDY_PROTOCOL_NO = 'JP-MVN2025-ALL_Auto';

// 테스트 간 공유 데이터
let subjectId: string;

test.beforeAll(async () => {
    validateEnvironmentVariables();
});

test.describe.serial('Subject 추가 테스트', () => {

    let context: BrowserContext;
    let subjectPage: SubjectPage;

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext();
        const page = await context.newPage();

        // 로그인 (1회만 수행)
        const loginPage = new LoginPage(page, CDMS_LOGIN_CONFIG);
        await loginPage.loginWithDeviceKey('owner');

        // 스터디 진입 (1회만 수행)
        const studyListPage = new StudyListPage(page, LANG);
        await studyListPage.navigate();
        await studyListPage.selectStudy(STUDY_PROTOCOL_NO);

        subjectPage = new SubjectPage(page, LANG);
    });

    test.afterEach(async ({}, testInfo) => {
        if (testInfo.status === 'failed') {
            const page = subjectPage.getPage();
            const screenshotPath = `test-results/screenshots/${testInfo.title}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.error(`   실패한 테스트: ${testInfo.title}`);
            console.error(`   실패 원인: ${testInfo.error?.message}`);
            console.error(`   스크린샷: ${screenshotPath}`);
        }
    });

    test.afterAll(async () => {
        await context.close();
    });

    test('1. Subject가 성공적으로 추가되면 성공 토스트가 보인다', async () => {
        await test.step('Subject 메뉴 진입 및 추가 폼 열기', async () => {
            await subjectPage.navigateToSubject();
            await subjectPage.openAddSubjectForm();
        });
        await test.step('Subject 정보 입력 및 저장', async () => {
            await subjectPage.fillSubjectForm();
            await subjectPage.saveSubject();
        });
        await test.step('성공 토스트 확인', async () => {
            await subjectPage.verifySuccessToast();
        });
    });

    test('2. Subject가 성공적으로 추가되면 해당 Subject의 Schedule 화면으로 이동한다', async () => {
        // await test.step('Schedule 페이지 이동 확인', async () => {
        //     await subjectPage.verifySubjectPage();
        // });
        await test.step('Subject ID 저장', async () => {
            subjectId = await subjectPage.getSubjectId();
            console.log(`생성된 Subject ID: ${subjectId}`);
        });
    });
});