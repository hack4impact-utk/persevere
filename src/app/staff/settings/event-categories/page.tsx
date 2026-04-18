import { type ReactElement } from "react";

import EventCategoriesSettingsClient from "./event-categories-settings-client";

/** Event categories catalog management. Auth handled by settings layout. */
export default function EventCategoriesSettingsPage(): ReactElement {
  return <EventCategoriesSettingsClient />;
}
