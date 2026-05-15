import type { Config } from "@netlify/functions";

export default async (): Promise<Response> => {
  const baseUrl = process.env.URL;
  const secret = process.env.CRON_SECRET;

  if (!baseUrl || !secret) {
    console.error(
      "[event-reminders] Missing URL or CRON_SECRET env var; skipping run",
    );
    return new Response("Missing required env vars", { status: 500 });
  }

  const response = await fetch(`${baseUrl}/api/cron/event-reminders`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(
      `[event-reminders] Upstream returned ${response.status}: ${body}`,
    );
    return new Response(`Upstream failed: ${response.status}`, { status: 502 });
  }

  return new Response("OK");
};

export const config: Config = {
  schedule: "0 8 * * *",
};
