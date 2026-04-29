import { z } from "zod";

import {
  backgroundCheckStatusEnum,
  hoursStatusEnum,
  notificationPreferenceEnum,
  opportunityStatusEnum,
  proficiencyLevelEnum,
  recipientTypeEnum,
  rsvpStatusEnum,
} from "@/db/schema/enums";

export const rsvpStatusSchema = z.enum(rsvpStatusEnum.enumValues);
export type RsvpStatus = z.infer<typeof rsvpStatusSchema>;

export const hoursStatusSchema = z.enum(hoursStatusEnum.enumValues);
export type HoursStatus = z.infer<typeof hoursStatusSchema>;

export const backgroundCheckStatusSchema = z.enum(
  backgroundCheckStatusEnum.enumValues,
);
export type BackgroundCheckStatus = z.infer<typeof backgroundCheckStatusSchema>;

export const notificationPreferenceSchema = z.enum(
  notificationPreferenceEnum.enumValues,
);
export type NotificationPreference = z.infer<
  typeof notificationPreferenceSchema
>;

export const opportunityStatusSchema = z.enum(opportunityStatusEnum.enumValues);
export type OpportunityStatus = z.infer<typeof opportunityStatusSchema>;

export const proficiencyLevelSchema = z.enum(proficiencyLevelEnum.enumValues);
export type ProficiencyLevel = z.infer<typeof proficiencyLevelSchema>;
// Narrowed: staff must assign a real level — "no_selection" is the system default only.
export const assignableProficiencyLevelSchema = proficiencyLevelSchema.exclude([
  "no_selection",
]);

export const recipientTypeSchema = z.enum(recipientTypeEnum.enumValues);
export type RecipientType = z.infer<typeof recipientTypeSchema>;
