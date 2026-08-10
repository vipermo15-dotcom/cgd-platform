CREATE TABLE `weekly_checkins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentUserId` int NOT NULL,
	`weekOf` timestamp NOT NULL,
	`selfReadiness` int NOT NULL,
	`completedThisWeek` text NOT NULL,
	`nextWeekGoal` text,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weekly_checkins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `weekly_checkins_studentUserId_idx` ON `weekly_checkins` (`studentUserId`);