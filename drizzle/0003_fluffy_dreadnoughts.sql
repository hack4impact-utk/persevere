ALTER TABLE "volunteers" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."volunteer_role";--> statement-breakpoint
CREATE TYPE "public"."volunteer_role" AS ENUM('volunteer', 'staff', 'admin');--> statement-breakpoint
ALTER TABLE "volunteers" ALTER COLUMN "role" SET DATA TYPE "public"."volunteer_role" USING "role"::"public"."volunteer_role";--> statement-breakpoint
ALTER TABLE "volunteers" ADD COLUMN "volunteer_type" text;