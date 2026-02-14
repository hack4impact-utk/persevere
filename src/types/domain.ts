import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { volunteers } from "@/db/schema";

export type Volunteer = InferSelectModel<typeof volunteers>;
export type NewVolunteer = InferInsertModel<typeof volunteers>;

/**
 * Availability data structure.
 * Represents time slots or availability periods as a flexible JSON object.
 * Example: { "monday": ["9am-12pm"], "tuesday": ["2pm-5pm"] }
 */
export type Availability = Record<string, string[] | string | boolean | number>;
