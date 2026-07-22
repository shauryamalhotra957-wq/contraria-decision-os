CREATE TABLE `audit_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`decision_id` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`checksum` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_decision_idx` ON `audit_events` (`decision_id`);--> statement-breakpoint
CREATE INDEX `audit_created_idx` ON `audit_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`confidence` real NOT NULL,
	`recommendation` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`decision_id` text NOT NULL,
	`source` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`source_type` text NOT NULL,
	`stance` text NOT NULL,
	`reliability` real NOT NULL,
	`observed_at` text NOT NULL,
	`tags` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `evidence_decision_idx` ON `evidence` (`decision_id`);--> statement-breakpoint
CREATE INDEX `evidence_stance_idx` ON `evidence` (`stance`);--> statement-breakpoint
CREATE TABLE `scenarios` (
	`id` text PRIMARY KEY NOT NULL,
	`decision_id` text NOT NULL,
	`name` text NOT NULL,
	`assumptions` text NOT NULL,
	`probability` real NOT NULL,
	`expected_value` real NOT NULL,
	`survival_probability` real NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `scenarios_decision_idx` ON `scenarios` (`decision_id`);