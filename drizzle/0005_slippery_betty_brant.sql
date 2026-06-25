CREATE TABLE `career_feedbacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentUserId` int NOT NULL,
	`authorUserId` int NOT NULL,
	`feedbackType` enum('job_analysis','application_strategy','ai_analysis','general') NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`mdFileUrl` text,
	`mdFileName` varchar(300),
	`aiModel` varchar(100),
	`targetCompany` varchar(200),
	`targetJob` varchar(200),
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `career_feedbacks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_activity_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentUserId` int NOT NULL,
	`trainingUserId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`sharedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_activity_shares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_feedbacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentUserId` int NOT NULL,
	`authorUserId` int NOT NULL,
	`docType` enum('resume','cover_letter','portfolio') NOT NULL,
	`docId` int,
	`content` text NOT NULL,
	`rating` enum('excellent','good','needs_improvement','poor'),
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_feedbacks_id` PRIMARY KEY(`id`)
);
