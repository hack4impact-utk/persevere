import { getServerSession as nextAuthGetServerSession } from "next-auth";
import authOptions from "@/app/api/auth/[...nextauth]/auth-options";

export async function getServerSession() {
  return await nextAuthGetServerSession(authOptions);
}

export async function requireAuth(role?: "mentor" | "guest_speaker" | "flexible" | "staff" | "admin") {
  const session = await getServerSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }
  
  if (role && session.user.role !== role) {
    throw new Error("Forbidden");
  }
  
  return session;
}
