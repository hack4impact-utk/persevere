import type { Config } from "@netlify/functions";

const closeExpiredEvents = async (): Promise<Response> => {
  const baseUrl = process.env.URL;
  const secret = process.env.CRON_SECRET;

  if (!baseUrl || !secret) {
    console.error(
      "[close-expired-events] Missing URL or CRON_SECRET env var; skipping run",
    );
    return new Response("Missing required env vars", { status: 500 });
  }

  const response = await fetch(`${baseUrl}/api/cron/close-expired-events`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(
      `[close-expired-events] Upstream returned ${response.status}: ${body}`,
    );
    return new Response(`Upstream failed: ${response.status}`, { status: 502 });
  }

  return new Response("OK");
};
export default closeExpiredEvents;

export const config: Config = {
  schedule: "*/30 * * * *",
};
