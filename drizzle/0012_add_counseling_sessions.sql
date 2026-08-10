CREATE TABLE `counseling_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentUserId` int NOT NULL,
	`counselorUserId` int NOT NULL,
	`sessionDate` timestamp NOT NULL,
	`topic` varchar(200) NOT NULL,
	`note` text NOT NULL,
	`followUpAction` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `counseling_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `counseling_sessions_studentUserId_idx` ON `counseling_sessions` (`studentUserId`);