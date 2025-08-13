ALTER TABLE "resources" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "content_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "last_scraped" timestamp;