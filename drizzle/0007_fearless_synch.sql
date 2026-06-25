ALTER TABLE `bookmarks` ADD `type` enum('job','student') DEFAULT 'job' NOT NULL;--> statement-breakpoint
UPDATE `bookmarks` SET `type` = 'student' WHERE `studentUserId` IS NOT NULL;--> statement-breakpoint
CREATE INDEX `ai_analyses_userId_idx` ON `ai_analyses` (`userId`);--> statement-breakpoint
CREATE INDEX `ai_logs_user_created_idx` ON `ai_logs` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ai_logs_type_idx` ON `ai_logs` (`type`);--> statement-breakpoint
CREATE INDEX `bookmarks_user_job_idx` ON `bookmarks` (`userId`,`jobPostingId`);--> statement-breakpoint
CREATE INDEX `bookmarks_user_student_idx` ON `bookmarks` (`userId`,`studentUserId`);--> statement-breakpoint
CREATE INDEX `career_feedbacks_studentUserId_idx` ON `career_feedbacks` (`studentUserId`);--> statement-breakpoint
CREATE INDEX `career_guidance_studentUserId_idx` ON `career_guidance` (`studentUserId`);--> statement-breakpoint
CREATE INDEX `cover_letters_userId_idx` ON `cover_letters` (`userId`);--> statement-breakpoint
CREATE INDEX `employment_tracking_studentUserId_idx` ON `employment_tracking` (`studentUserId`);--> statement-breakpoint
CREATE INDEX `hire_requests_studentUserId_idx` ON `hire_requests` (`studentUserId`);--> statement-breakpoint
CREATE INDEX `hire_requests_companyUserId_idx` ON `hire_requests` (`companyUserId`);--> statement-breakpoint
CREATE INDEX `hire_requests_status_idx` ON `hire_requests` (`status`);--> statement-breakpoint
CREATE INDEX `job_applications_jobPostingId_idx` ON `job_applications` (`jobPostingId`);--> statement-breakpoint
CREATE INDEX `job_applications_applicantUserId_idx` ON `job_applications` (`applicantUserId`);--> statement-breakpoint
CREATE INDEX `job_applications_status_idx` ON `job_applications` (`status`);--> statement-breakpoint
CREATE INDEX `job_postings_companyUserId_idx` ON `job_postings` (`companyUserId`);--> statement-breakpoint
CREATE INDEX `job_postings_status_idx` ON `job_postings` (`status`);--> statement-breakpoint
CREATE INDEX `notifications_user_read_idx` ON `notifications` (`userId`,`isRead`);--> statement-breakpoint
CREATE INDEX `portfolio_items_portfolioId_idx` ON `portfolio_items` (`portfolioId`);--> statement-breakpoint
CREATE INDEX `portfolio_items_userId_idx` ON `portfolio_items` (`userId`);--> statement-breakpoint
CREATE INDEX `portfolio_views_portfolioId_idx` ON `portfolio_views` (`portfolioId`);--> statement-breakpoint
CREATE INDEX `portfolios_userId_idx` ON `portfolios` (`userId`);--> statement-breakpoint
CREATE INDEX `portfolios_approvalStep_idx` ON `portfolios` (`approvalStep`);--> statement-breakpoint
CREATE INDEX `resumes_userId_idx` ON `resumes` (`userId`);--> statement-breakpoint
CREATE INDEX `resumes_approvalStep_idx` ON `resumes` (`approvalStep`);--> statement-breakpoint
CREATE INDEX `student_feedbacks_studentUserId_idx` ON `student_feedbacks` (`studentUserId`);--> statement-breakpoint
CREATE INDEX `student_profiles_userId_idx` ON `student_profiles` (`userId`);--> statement-breakpoint
CREATE INDEX `student_profiles_employmentStatus_idx` ON `student_profiles` (`employmentStatus`);