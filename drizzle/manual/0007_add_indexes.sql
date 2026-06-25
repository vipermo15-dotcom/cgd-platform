-- 0007_add_indexes.sql
-- 자주 WHERE/JOIN 조건으로 쓰이는 컬럼에 인덱스 추가 (성능 개선)
--
-- 적용 방법(둘 중 하나):
--   A) 의존성 설치 후 정식 마이그레이션 생성 (권장):
--      pnpm install && pnpm drizzle-kit generate && pnpm drizzle-kit migrate
--      → schema.ts의 index() 선언을 보고 drizzle가 동일 인덱스를 생성합니다.
--   B) 이 파일을 DB에 직접 실행:
--      mysql -u <user> -p <db> < drizzle/manual/0007_add_indexes.sql
--
-- 주의: MySQL은 CREATE INDEX IF NOT EXISTS를 지원하지 않습니다.
--       이미 존재하는 인덱스가 있으면 해당 문에서 에러가 나므로,
--       중복 시 그 줄만 건너뛰고 진행하세요.

CREATE INDEX `ai_logs_user_created_idx` ON `ai_logs` (`userId`, `createdAt`);
CREATE INDEX `ai_logs_type_idx` ON `ai_logs` (`type`);

CREATE INDEX `student_profiles_userId_idx` ON `student_profiles` (`userId`);
CREATE INDEX `student_profiles_employmentStatus_idx` ON `student_profiles` (`employmentStatus`);

CREATE INDEX `resumes_userId_idx` ON `resumes` (`userId`);
CREATE INDEX `resumes_approvalStep_idx` ON `resumes` (`approvalStep`);

CREATE INDEX `portfolios_userId_idx` ON `portfolios` (`userId`);
CREATE INDEX `portfolios_approvalStep_idx` ON `portfolios` (`approvalStep`);

CREATE INDEX `portfolio_items_portfolioId_idx` ON `portfolio_items` (`portfolioId`);
CREATE INDEX `portfolio_items_userId_idx` ON `portfolio_items` (`userId`);

CREATE INDEX `ai_analyses_userId_idx` ON `ai_analyses` (`userId`);

CREATE INDEX `cover_letters_userId_idx` ON `cover_letters` (`userId`);

CREATE INDEX `job_postings_companyUserId_idx` ON `job_postings` (`companyUserId`);
CREATE INDEX `job_postings_status_idx` ON `job_postings` (`status`);

CREATE INDEX `job_applications_jobPostingId_idx` ON `job_applications` (`jobPostingId`);
CREATE INDEX `job_applications_applicantUserId_idx` ON `job_applications` (`applicantUserId`);
CREATE INDEX `job_applications_status_idx` ON `job_applications` (`status`);

-- bookmarks: 종류 판별자 컬럼 추가 + 기존 데이터 백필 + 복합 인덱스
ALTER TABLE `bookmarks` ADD COLUMN `type` ENUM('job','student') NOT NULL DEFAULT 'job';
UPDATE `bookmarks` SET `type` = 'student' WHERE `studentUserId` IS NOT NULL;
CREATE INDEX `bookmarks_user_job_idx` ON `bookmarks` (`userId`, `jobPostingId`);
CREATE INDEX `bookmarks_user_student_idx` ON `bookmarks` (`userId`, `studentUserId`);

CREATE INDEX `notifications_user_read_idx` ON `notifications` (`userId`, `isRead`);

CREATE INDEX `career_guidance_studentUserId_idx` ON `career_guidance` (`studentUserId`);

CREATE INDEX `employment_tracking_studentUserId_idx` ON `employment_tracking` (`studentUserId`);

CREATE INDEX `portfolio_views_portfolioId_idx` ON `portfolio_views` (`portfolioId`);

CREATE INDEX `student_feedbacks_studentUserId_idx` ON `student_feedbacks` (`studentUserId`);

CREATE INDEX `career_feedbacks_studentUserId_idx` ON `career_feedbacks` (`studentUserId`);

CREATE INDEX `hire_requests_studentUserId_idx` ON `hire_requests` (`studentUserId`);
CREATE INDEX `hire_requests_companyUserId_idx` ON `hire_requests` (`companyUserId`);
CREATE INDEX `hire_requests_status_idx` ON `hire_requests` (`status`);
