import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { signOut } from "next-auth/react";
import authOptions from "@/app/api/auth/[...nextauth]/auth-options";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.name}!</p>
      <p>Email: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
      <p>Email Verified: {session.user.isEmailVerified ? "Yes" : "No"}</p>
      
      <form action={async () => {
        "use server";
        await signOut({ redirect: true });
      }}>
        <button type="submit" style={{ padding: "10px", backgroundColor: "#ff0000", color: "white", border: "none", borderRadius: "4px" }}>
          Sign Out
        </button>
      </form>
    </div>
  );
}
