CREATE TYPE "public"."background_check_status" AS ENUM('not_required', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."notification_preference" AS ENUM('email', 'sms', 'both', 'none');--> statement-breakpoint
CREATE TYPE "public"."opportunity_status" AS ENUM('open', 'full', 'completed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."proficiency_level" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('pending', 'confirmed', 'declined', 'attended', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."volunteer_role" AS ENUM('mentor', 'guest_speaker', 'flexible', 'staff', 'admin');--> statement-breakpoint
CREATE TABLE "admin_dashboard_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"action_type" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" integer,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_by_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "communication_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"recipient_id" integer NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"type" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"related_opportunity_id" integer
);
--> statement-breakpoint
CREATE TABLE "communication_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"type" text NOT NULL,
	"category" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" "opportunity_status" DEFAULT 'open' NOT NULL,
	"max_volunteers" integer,
	"created_by_id" integer NOT NULL,
	"recurrence_pattern" jsonb,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunity_interests" (
	"opportunity_id" integer NOT NULL,
	"interest_id" integer NOT NULL,
	CONSTRAINT "opportunity_interests_opportunity_id_interest_id_pk" PRIMARY KEY("opportunity_id","interest_id")
);
--> statement-breakpoint
CREATE TABLE "opportunity_required_skills" (
	"opportunity_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	CONSTRAINT "opportunity_required_skills_opportunity_id_skill_id_pk" PRIMARY KEY("opportunity_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "volunteer_hours" (
	"id" serial PRIMARY KEY NOT NULL,
	"volunteer_id" integer NOT NULL,
	"opportunity_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"hours" real NOT NULL,
	"notes" text,
	"verified_by" integer,
	"verified_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "volunteer_rsvps" (
	"volunteer_id" integer NOT NULL,
	"opportunity_id" integer NOT NULL,
	"status" "rsvp_status" DEFAULT 'pending' NOT NULL,
	"rsvp_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	CONSTRAINT "volunteer_rsvps_volunteer_id_opportunity_id_pk" PRIMARY KEY("volunteer_id","opportunity_id")
);
--> statement-breakpoint
CREATE TABLE "interests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text
);
--> statement-breakpoint
CREATE TABLE "volunteer_interests" (
	"volunteer_id" integer NOT NULL,
	"interest_id" integer NOT NULL,
	CONSTRAINT "volunteer_interests_volunteer_id_interest_id_pk" PRIMARY KEY("volunteer_id","interest_id")
);
--> statement-breakpoint
CREATE TABLE "volunteer_skills" (
	"volunteer_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"level" "proficiency_level" NOT NULL,
	CONSTRAINT "volunteer_skills_volunteer_id_skill_id_pk" PRIMARY KEY("volunteer_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "volunteers" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"bio" text,
	"role" "volunteer_role" NOT NULL,
	"is_alumni" boolean DEFAULT false NOT NULL,
	"background_check_status" "background_check_status" DEFAULT 'not_required' NOT NULL,
	"media_release" boolean DEFAULT false NOT NULL,
	"profile_picture" text,
	"availability" jsonb,
	"notification_preference" "notification_preference" DEFAULT 'email' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "volunteers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "admin_dashboard_actions" ADD CONSTRAINT "admin_dashboard_actions_admin_id_volunteers_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."volunteers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_id_volunteers_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."volunteers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_sender_id_volunteers_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."volunteers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_recipient_id_volunteers_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."volunteers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_created_by_id_volunteers_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."volunteers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_interests" ADD CONSTRAINT "opportunity_interests_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_interests" ADD CONSTRAINT "opportunity_interests_interest_id_interests_id_fk" FOREIGN KEY ("interest_id") REFERENCES "public"."interests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_required_skills" ADD CONSTRAINT "opportunity_required_skills_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_required_skills" ADD CONSTRAINT "opportunity_required_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_hours" ADD CONSTRAINT "volunteer_hours_volunteer_id_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_hours" ADD CONSTRAINT "volunteer_hours_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_hours" ADD CONSTRAINT "volunteer_hours_verified_by_volunteers_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."volunteers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_rsvps" ADD CONSTRAINT "volunteer_rsvps_volunteer_id_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_rsvps" ADD CONSTRAINT "volunteer_rsvps_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_interests" ADD CONSTRAINT "volunteer_interests_volunteer_id_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_interests" ADD CONSTRAINT "volunteer_interests_interest_id_interests_id_fk" FOREIGN KEY ("interest_id") REFERENCES "public"."interests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_skills" ADD CONSTRAINT "volunteer_skills_volunteer_id_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_skills" ADD CONSTRAINT "volunteer_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;