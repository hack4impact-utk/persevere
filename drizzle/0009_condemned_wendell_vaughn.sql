CREATE INDEX "staff_notif_pref_idx" ON "staff" USING btree ("user_id") WHERE notification_preference != 'none';--> statement-breakpoint
CREATE INDEX "users_is_active_idx" ON "users" USING btree ("id") WHERE is_active = true;--> statement-breakpoint
CREATE INDEX "volunteers_notif_pref_idx" ON "volunteers" USING btree ("user_id") WHERE notification_preference != 'none';