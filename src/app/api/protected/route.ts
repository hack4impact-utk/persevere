import { requireAuth } from "@/utils/auth";

export async function GET() {
  const session = await requireAuth("admin"); // or "staff" or no role
  
  return Response.json({ message: "Protected data", user: session.user });
}
