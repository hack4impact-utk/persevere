import { requireAuth } from "@/utils/auth";

export async function GET(): Promise<Response> {
  try {
    const session = await requireAuth("admin"); // or "staff" or no role
    return Response.json({ message: "Protected data", user: session.user });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
