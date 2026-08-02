CREATE TABLE `career_matching_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recordId` int NOT NULL,
	`authorUserId` int NOT NULL,
	`authorRole` enum('student','admin') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `career_matching_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `career_matching_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentUserId` int NOT NULL,
	`professorUserId` int,
	`resumeId` int,
	`coverLetterId` int,
	`portfolioId` int,
	`desiredEmployerLink` text,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `career_matching_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `career_matching_comments_recordId_idx` ON `career_matching_comments` (`recordId`);--> statement-breakpoint
CREATE INDEX `career_matching_records_studentUserId_idx` ON `career_matching_records` (`studentUserId`);
