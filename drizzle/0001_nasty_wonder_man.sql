CREATE TYPE "public"."recipient_type" AS ENUM('volunteers', 'staff', 'both');--> statement-breakpoint
CREATE TABLE "bulk_communication_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"recipient_type" "recipient_type" NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL
);
--> statement-breakpoint
DROP TABLE "communication_logs" CASCADE;--> statement-breakpoint
ALTER TABLE "bulk_communication_logs" ADD CONSTRAINT "bulk_communication_logs_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;