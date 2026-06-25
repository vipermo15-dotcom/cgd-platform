CREATE TABLE `job_coaching_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentUserId` int NOT NULL,
	`companyName` varchar(200) NOT NULL,
	`jobTitle` varchar(200) NOT NULL,
	`jobUrl` text,
	`jobDescription` text,
	`resumeId` int,
	`coverLetterId` int,
	`portfolioId` int,
	`studentMessage` text,
	`status` enum('pending','in_review','completed') NOT NULL DEFAULT 'pending',
	`feedbackContent` text,
	`reviewerUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_coaching_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `job_coaching_requests_studentUserId_idx` ON `job_coaching_requests` (`studentUserId`);--> statement-breakpoint
CREATE INDEX `job_coaching_requests_status_idx` ON `job_coaching_requests` (`status`);