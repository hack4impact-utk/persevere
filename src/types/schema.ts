import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { volunteers } from "@/db/schema";

export type Volunteer = InferSelectModel<typeof volunteers>;
export type NewVolunteer = InferInsertModel<typeof volunteers>;

// Legacy type aliases for backward compatibility
export type User = Volunteer;
export type NewUser = NewVolunteer;
