CREATE TABLE `portfolio_guide_lookups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nameInput` varchar(100) NOT NULL,
	`matched` boolean NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolio_guide_lookups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `career_guidance` MODIFY COLUMN `careerTrack` enum('editorial_design','brand_design','goods_design','content_marketing','sns_content','undecided') NOT NULL DEFAULT 'undecided';--> statement-breakpoint
ALTER TABLE `career_guidance` ADD `guidanceDocs` json;--> statement-breakpoint
CREATE INDEX `portfolio_guide_lookups_name_created_idx` ON `portfolio_guide_lookups` (`nameInput`,`createdAt`);