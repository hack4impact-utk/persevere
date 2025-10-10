-- Volunteer Management Schema Migration
-- This migration creates all tables for the Persevere volunteer management system MVP

-- Create enums
CREATE TYPE "volunteer_role" AS ENUM('volunteer', 'staff', 'admin');
CREATE TYPE "opportunity_status" AS ENUM('open', 'full', 'completed', 'canceled');
CREATE TYPE "rsvp_status" AS ENUM('pending', 'confirmed', 'declined', 'no_show');
CREATE TYPE "background_check_status" AS ENUM('not_required', 'pending', 'approved', 'rejected');
CREATE TYPE "proficiency_level" AS ENUM('beginner', 'intermediate', 'advanced');
CREATE TYPE "notification_preference" AS ENUM('email', 'sms', 'both', 'none');

-- Create volunteers table
CREATE TABLE "volunteers" (
	"id" serial PRIMARY KEY NOT NULL,
	"firstName" text NOT NULL,
	"lastName" text NOT NULL,
	"email" text UNIQUE NOT NULL,
	"phone" text,
	"role" "volunteer_role" DEFAULT 'volunteer' NOT NULL,
	"bio" text,
	"availability" jsonb,
	"isAlumni" boolean DEFAULT false NOT NULL,
	"backgroundCheckStatus" "background_check_status" DEFAULT 'not_required' NOT NULL,
	"mediaRelease" boolean DEFAULT false NOT NULL,
	"profilePicture" text,
	"notifyByEmail" boolean DEFAULT true NOT NULL,
	"notifyBySMS" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Create skills table
CREATE TABLE "skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text
);

-- Create interests table
CREATE TABLE "interests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);

-- Create volunteer_skills junction table
CREATE TABLE "volunteer_skills" (
	"volunteerId" integer NOT NULL,
	"skillId" integer NOT NULL,
	"level" "proficiency_level" NOT NULL,
	CONSTRAINT "volunteer_skills_pk" PRIMARY KEY("volunteerId","skillId")
);

-- Create volunteer_interests junction table
CREATE TABLE "volunteer_interests" (
	"volunteerId" integer NOT NULL,
	"interestId" integer NOT NULL,
	CONSTRAINT "volunteer_interests_pk" PRIMARY KEY("volunteerId","interestId")
);

-- Create opportunities table
CREATE TABLE "opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"status" "opportunity_status" DEFAULT 'open' NOT NULL,
	"maxVolunteers" integer,
	"createdById" integer NOT NULL,
	"recurrencePattern" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Create opportunity_required_skills junction table
CREATE TABLE "opportunity_required_skills" (
	"opportunityId" integer NOT NULL,
	"skillId" integer NOT NULL,
	CONSTRAINT "opportunity_required_skills_pk" PRIMARY KEY("opportunityId","skillId")
);

-- Create opportunity_interests junction table
CREATE TABLE "opportunity_interests" (
	"opportunityId" integer NOT NULL,
	"interestId" integer NOT NULL,
	CONSTRAINT "opportunity_interests_pk" PRIMARY KEY("opportunityId","interestId")
);

-- Create volunteer_rsvps table
CREATE TABLE "volunteer_rsvps" (
	"volunteerId" integer NOT NULL,
	"opportunityId" integer NOT NULL,
	"status" "rsvp_status" DEFAULT 'pending' NOT NULL,
	"rsvpDate" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	CONSTRAINT "volunteer_rsvps_pk" PRIMARY KEY("volunteerId","opportunityId")
);

-- Create volunteer_hours table
CREATE TABLE "volunteer_hours" (
	"id" serial PRIMARY KEY NOT NULL,
	"volunteerId" integer NOT NULL,
	"opportunityId" integer NOT NULL,
	"date" timestamp NOT NULL,
	"hours" real NOT NULL,
	"notes" text
);

-- Create communication_logs table
CREATE TABLE "communication_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"senderId" integer NOT NULL,
	"recipientId" integer NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"sentAt" timestamp DEFAULT now() NOT NULL
);

-- Create communication_templates table
CREATE TABLE "communication_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

-- Create admin_dashboard_actions table
CREATE TABLE "admin_dashboard_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"adminId" integer NOT NULL,
	"actionType" text NOT NULL,
	"targetType" text NOT NULL,
	"targetId" integer,
	"details" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

-- Create system_settings table
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text UNIQUE NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "volunteer_skills" ADD CONSTRAINT "volunteer_skills_volunteerId_volunteers_id_fk" FOREIGN KEY ("volunteerId") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "volunteer_skills" ADD CONSTRAINT "volunteer_skills_skillId_skills_id_fk" FOREIGN KEY ("skillId") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "volunteer_interests" ADD CONSTRAINT "volunteer_interests_volunteerId_volunteers_id_fk" FOREIGN KEY ("volunteerId") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "volunteer_interests" ADD CONSTRAINT "volunteer_interests_interestId_interests_id_fk" FOREIGN KEY ("interestId") REFERENCES "public"."interests"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_createdById_volunteers_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."volunteers"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "opportunity_required_skills" ADD CONSTRAINT "opportunity_required_skills_opportunityId_opportunities_id_fk" FOREIGN KEY ("opportunityId") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "opportunity_required_skills" ADD CONSTRAINT "opportunity_required_skills_skillId_skills_id_fk" FOREIGN KEY ("skillId") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "opportunity_interests" ADD CONSTRAINT "opportunity_interests_opportunityId_opportunities_id_fk" FOREIGN KEY ("opportunityId") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "opportunity_interests" ADD CONSTRAINT "opportunity_interests_interestId_interests_id_fk" FOREIGN KEY ("interestId") REFERENCES "public"."interests"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "volunteer_rsvps" ADD CONSTRAINT "volunteer_rsvps_volunteerId_volunteers_id_fk" FOREIGN KEY ("volunteerId") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "volunteer_rsvps" ADD CONSTRAINT "volunteer_rsvps_opportunityId_opportunities_id_fk" FOREIGN KEY ("opportunityId") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "volunteer_hours" ADD CONSTRAINT "volunteer_hours_volunteerId_volunteers_id_fk" FOREIGN KEY ("volunteerId") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "volunteer_hours" ADD CONSTRAINT "volunteer_hours_opportunityId_opportunities_id_fk" FOREIGN KEY ("opportunityId") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_senderId_volunteers_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."volunteers"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_recipientId_volunteers_id_fk" FOREIGN KEY ("recipientId") REFERENCES "public"."volunteers"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "admin_dashboard_actions" ADD CONSTRAINT "admin_dashboard_actions_adminId_volunteers_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."volunteers"("id") ON DELETE restrict ON UPDATE no action;