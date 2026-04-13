import { type ReactElement } from "react";

import EmailTemplatesSettingsClient from "./email-templates-settings-client";

/** Email templates management. Auth handled by settings layout. */
export default function EmailTemplatesSettingsPage(): ReactElement {
  return <EmailTemplatesSettingsClient />;
}
