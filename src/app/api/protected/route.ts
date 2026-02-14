import { AuthError, requireAuth } from "@/utils/server/auth";

export async function GET(): Promise<Response> {
  try {
    const session = await requireAuth("admin"); // or "staff" or no role
    return Response.json({ message: "Protected data", user: session.user });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
