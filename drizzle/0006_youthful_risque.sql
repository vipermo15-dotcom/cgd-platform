CREATE TABLE `hire_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyUserId` int NOT NULL,
	`studentUserId` int NOT NULL,
	`reviewerUserId` int,
	`position` varchar(200) NOT NULL,
	`employmentType` enum('fulltime','contract','freelance','intern') NOT NULL DEFAULT 'fulltime',
	`workLocation` varchar(200),
	`salary` varchar(200),
	`message` text,
	`contactMethod` enum('platform','kakaotalk','email') DEFAULT 'platform',
	`deadline` timestamp,
	`status` enum('pending','approved','rejected','accepted','declined') NOT NULL DEFAULT 'pending',
	`reviewNote` text,
	`studentNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hire_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `talent_pool_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentUserId` int NOT NULL,
	`isPublic` boolean NOT NULL DEFAULT false,
	`exposeResume` boolean NOT NULL DEFAULT true,
	`exposePortfolio` boolean NOT NULL DEFAULT true,
	`exposeCoverLetterPreview` boolean NOT NULL DEFAULT true,
	`exposeFullCoverLetter` boolean NOT NULL DEFAULT false,
	`consentedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `talent_pool_consents_id` PRIMARY KEY(`id`),
	CONSTRAINT `talent_pool_consents_studentUserId_unique` UNIQUE(`studentUserId`)
);
