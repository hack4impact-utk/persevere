ALTER TABLE "volunteers" ADD COLUMN "password" text NOT NULL;--> statement-breakpoint
ALTER TABLE "volunteers" ADD COLUMN "is_email_verified" boolean DEFAULT false NOT NULL;