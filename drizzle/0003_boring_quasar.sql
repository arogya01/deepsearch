CREATE TABLE "message_parts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"part_index" integer NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"is_final" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"sequence" integer NOT NULL,
	"role" text NOT NULL,
	"status" text NOT NULL,
	"content" jsonb DEFAULT 'null'::jsonb,
	"metadata" jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resumable_streams" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"message_id" text NOT NULL,
	"status" text NOT NULL,
	"cursor" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_sessions" DROP CONSTRAINT "chat_sessions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "message_count" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD COLUMN "active_stream_id" text;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD COLUMN "last_message_at" timestamp;--> statement-breakpoint
ALTER TABLE "message_parts" ADD CONSTRAINT "message_parts_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumable_streams" ADD CONSTRAINT "resumable_streams_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumable_streams" ADD CONSTRAINT "resumable_streams_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "message_parts_message_index_idx" ON "message_parts" USING btree ("message_id","part_index");--> statement-breakpoint
CREATE INDEX "message_parts_message_final_idx" ON "message_parts" USING btree ("message_id","is_final");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_session_sequence_idx" ON "messages" USING btree ("session_id","sequence");--> statement-breakpoint
CREATE INDEX "messages_session_status_idx" ON "messages" USING btree ("session_id","status");--> statement-breakpoint
CREATE INDEX "resumable_streams_session_idx" ON "resumable_streams" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "resumable_streams_status_expiry_idx" ON "resumable_streams" USING btree ("status","expires_at");--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_sessions_user_id_idx" ON "chat_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_sessions_user_active_idx" ON "chat_sessions" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "chat_sessions_active_stream_idx" ON "chat_sessions" USING btree ("active_stream_id");--> statement-breakpoint
CREATE INDEX "chat_sessions_last_message_idx" ON "chat_sessions" USING btree ("last_message_at");--> statement-breakpoint
ALTER TABLE "chat_sessions" DROP COLUMN "messages";