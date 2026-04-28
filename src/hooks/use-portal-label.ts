import { useSession } from "next-auth/react";

export function usePortalLabel(): string {
  const { data: session } = useSession();
  return session?.user?.role === "admin" ? "Admin Portal" : "Staff Portal";
}
