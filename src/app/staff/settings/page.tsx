import { redirect } from "next/navigation";

export default function SettingsPage(): never {
  redirect("/staff/settings/skills");
}
