import { eq } from "drizzle-orm";

import db from "@/db";
import { users, volunteers } from "@/db/schema";
import type {
  BackgroundCheckStatus,
  NotificationPreference,
} from "@/lib/status-enums";
import { ConflictError } from "@/utils/errors";

export type VolunteerUpdateFields = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  profilePicture?: string;
  isActive?: boolean;
  volunteerType?: string;
  isAlumni?: boolean;
  backgroundCheckStatus?: BackgroundCheckStatus;
  availability?: Record<string, unknown>;
  notificationPreference?: NotificationPreference;
  employer?: string;
  jobTitle?: string;
  city?: string;
  state?: string;
  referralSource?: string;
};

type UserUpdateData = Pick<
  VolunteerUpdateFields,
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "bio"
  | "profilePicture"
  | "isActive"
>;

type VolunteerUpdateData = Pick<
  VolunteerUpdateFields,
  | "volunteerType"
  | "isAlumni"
  | "backgroundCheckStatus"
  | "availability"
  | "notificationPreference"
  | "employer"
  | "jobTitle"
  | "city"
  | "state"
  | "referralSource"
>;

const USER_FIELDS: readonly (keyof UserUpdateData)[] = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "bio",
  "profilePicture",
  "isActive",
];

const VOLUNTEER_FIELDS: readonly (keyof VolunteerUpdateData)[] = [
  "volunteerType",
  "isAlumni",
  "backgroundCheckStatus",
  "availability",
  "notificationPreference",
  "employer",
  "jobTitle",
  "city",
  "state",
  "referralSource",
];

function pickDefined<K extends keyof VolunteerUpdateFields>(
  fields: VolunteerUpdateFields,
  keys: readonly K[],
): Pick<VolunteerUpdateFields, K> {
  const out: Partial<Pick<VolunteerUpdateFields, K>> = {};
  for (const key of keys) {
    if (fields[key] !== undefined) {
      out[key] = fields[key];
    }
  }
  return out as Pick<VolunteerUpdateFields, K>;
}

export async function applyVolunteerUpdate(
  volunteerId: number,
  fields: VolunteerUpdateFields,
): Promise<{
  volunteers: typeof volunteers.$inferSelect;
  users: typeof users.$inferSelect | null;
} | null> {
  const [existing] = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.id, volunteerId));

  if (!existing) return null;

  if (fields.email !== undefined) {
    const collision = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, fields.email));
    if (collision.length > 0 && collision[0].id !== existing.userId) {
      throw new ConflictError("That email address is already in use");
    }
  }

  const userData = pickDefined(fields, USER_FIELDS);
  const volunteerData = pickDefined(fields, VOLUNTEER_FIELDS);

  // neon-http doesn't support transactions — writes are sequential.
  // Users-first: email collisions surface before the volunteers row is touched.
  if (Object.keys(userData).length > 0) {
    try {
      await db.update(users).set(userData).where(eq(users.id, existing.userId));
    } catch (error) {
      console.error(
        `[volunteer-update] Failed updating users table for volunteerId=${volunteerId}:`,
        error,
      );
      throw error;
    }
  }

  if (Object.keys(volunteerData).length > 0) {
    try {
      await db
        .update(volunteers)
        .set(volunteerData)
        .where(eq(volunteers.id, volunteerId));
    } catch (error) {
      console.error(
        `[volunteer-update] PARTIAL WRITE: users table may have been updated but volunteers table failed for volunteerId=${volunteerId}:`,
        error,
      );
      throw error;
    }
  }

  const [updated] = await db
    .select()
    .from(volunteers)
    .leftJoin(users, eq(volunteers.userId, users.id))
    .where(eq(volunteers.id, volunteerId));

  return updated ?? null;
}
