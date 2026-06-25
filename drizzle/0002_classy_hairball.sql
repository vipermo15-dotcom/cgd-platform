ALTER TABLE `ai_analyses` MODIFY COLUMN `strengths` json;--> statement-breakpoint
ALTER TABLE `ai_analyses` MODIFY COLUMN `weaknesses` json;--> statement-breakpoint
ALTER TABLE `ai_analyses` MODIFY COLUMN `recommendedSkills` json;--> statement-breakpoint
ALTER TABLE `job_postings` MODIFY COLUMN `requiredSkills` json;--> statement-breakpoint
ALTER TABLE `job_postings` MODIFY COLUMN `preferredSkills` json;--> statement-breakpoint
ALTER TABLE `portfolio_items` MODIFY COLUMN `tools` json;--> statement-breakpoint
ALTER TABLE `student_profiles` MODIFY COLUMN `skills` json;--> statement-breakpoint
ALTER TABLE `student_profiles` MODIFY COLUMN `certificates` json;