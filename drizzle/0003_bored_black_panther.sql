CREATE TABLE `resumes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100),
	`birthDate` varchar(20),
	`address` varchar(300),
	`phone` varchar(20),
	`email` varchar(320),
	`education` json,
	`career` json,
	`certificates` json,
	`languages` json,
	`skills` json,
	`summary` text,
	`isPublic` boolean NOT NULL DEFAULT false,
	`approvalStep` enum('draft','submitted','reviewing','approved','rejected') NOT NULL DEFAULT 'draft',
	`approvalNote` text,
	`approvedBy` int,
	`approvedAt` timestamp,
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resumes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cover_letters` ADD `approvalStep` enum('draft','submitted','reviewing','approved','rejected') DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `cover_letters` ADD `approvalNote` text;--> statement-breakpoint
ALTER TABLE `cover_letters` ADD `approvedBy` int;--> statement-breakpoint
ALTER TABLE `cover_letters` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `cover_letters` ADD `submittedAt` timestamp;--> statement-breakpoint
ALTER TABLE `job_applications` ADD `resumeId` int;--> statement-breakpoint
ALTER TABLE `job_applications` ADD `matchedBy` int;--> statement-breakpoint
ALTER TABLE `job_applications` ADD `matchNote` text;--> statement-breakpoint
ALTER TABLE `portfolios` ADD `pdfUrl` text;--> statement-breakpoint
ALTER TABLE `portfolios` ADD `externalUrl` text;--> statement-breakpoint
ALTER TABLE `portfolios` ADD `portfolioType` enum('items','pdf','url') DEFAULT 'items' NOT NULL;--> statement-breakpoint
ALTER TABLE `portfolios` ADD `approvalStep` enum('draft','submitted','reviewing','approved','rejected') DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `portfolios` ADD `approvalNote` text;--> statement-breakpoint
ALTER TABLE `portfolios` ADD `approvedBy` int;--> statement-breakpoint
ALTER TABLE `portfolios` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `portfolios` ADD `submittedAt` timestamp;