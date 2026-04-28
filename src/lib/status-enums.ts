import { z } from "zod";

import {
  backgroundCheckStatusEnum,
  hoursStatusEnum,
  notificationPreferenceEnum,
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
