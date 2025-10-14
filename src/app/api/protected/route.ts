import { requireAuth } from "@/utils/auth";

export async function GET(): Promise<Response> {
  const session = await requireAuth("admin"); // or "staff" or no role

  return Response.json({ message: "Protected data", user: session.user });
}
