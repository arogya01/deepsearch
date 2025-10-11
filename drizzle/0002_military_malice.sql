ALTER TABLE "search_queries" ALTER COLUMN "result_count" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "search_queries" ALTER COLUMN "result_count" DROP NOT NULL;