import { pgTable, serial, text, boolean, timestamp, unique, jsonb, foreignKey, integer, real, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const backgroundCheckStatus = pgEnum("background_check_status", ['not_required', 'pending', 'approved', 'rejected'])
export const notificationPreference = pgEnum("notification_preference", ['email', 'sms', 'both', 'none'])
export const opportunityStatus = pgEnum("opportunity_status", ['open', 'full', 'completed', 'canceled'])
export const proficiencyLevel = pgEnum("proficiency_level", ['beginner', 'intermediate', 'advanced'])
export const rsvpStatus = pgEnum("rsvp_status", ['pending', 'confirmed', 'declined', 'attended', 'no_show'])
export const volunteerRole = pgEnum("volunteer_role", ['mentor', 'guest_speaker', 'flexible', 'staff', 'admin'])


export const communicationTemplates = pgTable("communication_templates", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	subject: text().notNull(),
	body: text().notNull(),
	type: text().notNull(),
	category: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const volunteers = pgTable("volunteers", {
	id: serial().primaryKey().notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	email: text().notNull(),
	phone: text(),
	bio: text(),
	role: volunteerRole().notNull(),
	isAlumni: boolean("is_alumni").default(false).notNull(),
	backgroundCheckStatus: backgroundCheckStatus("background_check_status").default('not_required').notNull(),
	mediaRelease: boolean("media_release").default(false).notNull(),
	profilePicture: text("profile_picture"),
	availability: jsonb(),
	notificationPreference: notificationPreference("notification_preference").default('email').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("volunteers_email_unique").on(table.email),
]);

export const skills = pgTable("skills", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	category: text(),
});

export const interests = pgTable("interests", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
});

export const opportunities = pgTable("opportunities", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	location: text().notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }).notNull(),
	status: opportunityStatus().default('open').notNull(),
	maxVolunteers: integer("max_volunteers"),
	createdById: integer("created_by_id").notNull(),
	recurrencePattern: jsonb("recurrence_pattern"),
	isRecurring: boolean("is_recurring").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [volunteers.id],
			name: "opportunities_created_by_id_volunteers_id_fk"
		}).onDelete("restrict"),
]);

export const volunteerHours = pgTable("volunteer_hours", {
	id: serial().primaryKey().notNull(),
	volunteerId: integer("volunteer_id").notNull(),
	opportunityId: integer("opportunity_id").notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	hours: real().notNull(),
	notes: text(),
	verifiedBy: integer("verified_by"),
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.volunteerId],
			foreignColumns: [volunteers.id],
			name: "volunteer_hours_volunteer_id_volunteers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.opportunityId],
			foreignColumns: [opportunities.id],
			name: "volunteer_hours_opportunity_id_opportunities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.verifiedBy],
			foreignColumns: [volunteers.id],
			name: "volunteer_hours_verified_by_volunteers_id_fk"
		}).onDelete("set null"),
]);

export const communicationLogs = pgTable("communication_logs", {
	id: serial().primaryKey().notNull(),
	senderId: integer("sender_id").notNull(),
	recipientId: integer("recipient_id").notNull(),
	subject: text().notNull(),
	body: text().notNull(),
	type: text().notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow().notNull(),
	status: text().default('sent').notNull(),
	relatedOpportunityId: integer("related_opportunity_id"),
}, (table) => [
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [volunteers.id],
			name: "communication_logs_sender_id_volunteers_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.recipientId],
			foreignColumns: [volunteers.id],
			name: "communication_logs_recipient_id_volunteers_id_fk"
		}).onDelete("restrict"),
]);

export const adminDashboardActions = pgTable("admin_dashboard_actions", {
	id: serial().primaryKey().notNull(),
	adminId: integer("admin_id").notNull(),
	actionType: text("action_type").notNull(),
	targetType: text("target_type").notNull(),
	targetId: integer("target_id"),
	details: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.adminId],
			foreignColumns: [volunteers.id],
			name: "admin_dashboard_actions_admin_id_volunteers_id_fk"
		}).onDelete("restrict"),
]);

export const systemSettings = pgTable("system_settings", {
	id: serial().primaryKey().notNull(),
	key: text().notNull(),
	value: jsonb().notNull(),
	description: text(),
	updatedById: integer("updated_by_id").notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.updatedById],
			foreignColumns: [volunteers.id],
			name: "system_settings_updated_by_id_volunteers_id_fk"
		}).onDelete("restrict"),
	unique("system_settings_key_unique").on(table.key),
]);

export const volunteerInterests = pgTable("volunteer_interests", {
	volunteerId: integer("volunteer_id").notNull(),
	interestId: integer("interest_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.volunteerId],
			foreignColumns: [volunteers.id],
			name: "volunteer_interests_volunteer_id_volunteers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.interestId],
			foreignColumns: [interests.id],
			name: "volunteer_interests_interest_id_interests_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.volunteerId, table.interestId], name: "volunteer_interests_volunteer_id_interest_id_pk"}),
]);

export const opportunityRequiredSkills = pgTable("opportunity_required_skills", {
	opportunityId: integer("opportunity_id").notNull(),
	skillId: integer("skill_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.opportunityId],
			foreignColumns: [opportunities.id],
			name: "opportunity_required_skills_opportunity_id_opportunities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.skillId],
			foreignColumns: [skills.id],
			name: "opportunity_required_skills_skill_id_skills_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.opportunityId, table.skillId], name: "opportunity_required_skills_opportunity_id_skill_id_pk"}),
]);

export const opportunityInterests = pgTable("opportunity_interests", {
	opportunityId: integer("opportunity_id").notNull(),
	interestId: integer("interest_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.opportunityId],
			foreignColumns: [opportunities.id],
			name: "opportunity_interests_opportunity_id_opportunities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.interestId],
			foreignColumns: [interests.id],
			name: "opportunity_interests_interest_id_interests_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.opportunityId, table.interestId], name: "opportunity_interests_opportunity_id_interest_id_pk"}),
]);

export const volunteerSkills = pgTable("volunteer_skills", {
	volunteerId: integer("volunteer_id").notNull(),
	skillId: integer("skill_id").notNull(),
	level: proficiencyLevel().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.volunteerId],
			foreignColumns: [volunteers.id],
			name: "volunteer_skills_volunteer_id_volunteers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.skillId],
			foreignColumns: [skills.id],
			name: "volunteer_skills_skill_id_skills_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.volunteerId, table.skillId], name: "volunteer_skills_volunteer_id_skill_id_pk"}),
]);

export const volunteerRsvps = pgTable("volunteer_rsvps", {
	volunteerId: integer("volunteer_id").notNull(),
	opportunityId: integer("opportunity_id").notNull(),
	status: rsvpStatus().default('pending').notNull(),
	rsvpAt: timestamp("rsvp_at", { mode: 'string' }).defaultNow().notNull(),
	notes: text(),
}, (table) => [
	foreignKey({
			columns: [table.volunteerId],
			foreignColumns: [volunteers.id],
			name: "volunteer_rsvps_volunteer_id_volunteers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.opportunityId],
			foreignColumns: [opportunities.id],
			name: "volunteer_rsvps_opportunity_id_opportunities_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.volunteerId, table.opportunityId], name: "volunteer_rsvps_volunteer_id_opportunity_id_pk"}),
]);
