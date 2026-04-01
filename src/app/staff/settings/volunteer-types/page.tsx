import { type ReactElement } from "react";

import VolunteerTypesSettingsClient from "./volunteer-types-settings-client";

/** Volunteer types catalog management. Auth handled by settings layout. */
export default function VolunteerTypesSettingsPage(): ReactElement {
  return <VolunteerTypesSettingsClient />;
}
