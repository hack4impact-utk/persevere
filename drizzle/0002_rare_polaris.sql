CREATE TYPE "public"."hours_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."proficiency_level" ADD VALUE 'no_selection' BEFORE 'beginner';--> statement-breakpoint
CREATE TABLE "onboarding_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"action_type" text DEFAULT 'sign' NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"required" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volunteer_document_signatures" (
	"volunteer_id" integer NOT NULL,
	"document_id" integer NOT NULL,
	"signed_at" timestamp DEFAULT now() NOT NULL,
	"consent_given" boolean,
	CONSTRAINT "volunteer_document_signatures_volunteer_id_document_id_pk" PRIMARY KEY("volunteer_id","document_id")
);
--> statement-breakpoint
CREATE TABLE "volunteer_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "volunteer_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "account" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "session" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "account" CASCADE;--> statement-breakpoint
DROP TABLE "session" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_nextauth_id_unique";--> statement-breakpoint
ALTER TABLE "volunteer_hours" ADD COLUMN "status" "hours_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "volunteer_hours" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "volunteers" ADD COLUMN "employer" text;--> statement-breakpoint
ALTER TABLE "volunteers" ADD COLUMN "job_title" text;--> statement-breakpoint
ALTER TABLE "volunteers" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "volunteers" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "volunteers" ADD COLUMN "referral_source" text;--> statement-breakpoint
ALTER TABLE "volunteer_document_signatures" ADD CONSTRAINT "volunteer_document_signatures_volunteer_id_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_document_signatures" ADD CONSTRAINT "volunteer_document_signatures_document_id_onboarding_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."onboarding_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vds_document_id_idx" ON "volunteer_document_signatures" USING btree ("document_id");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "nextauth_id";--> statement-breakpoint
ALTER TABLE "volunteers" DROP COLUMN "media_release";--> statement-breakpoint
ALTER TABLE "interests" ADD CONSTRAINT "interests_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_unique" UNIQUE("user_id");--> statement-breakpoint
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_user_id_unique" UNIQUE("user_id");--> statement-breakpoint
DROP TYPE "public"."volunteer_role";