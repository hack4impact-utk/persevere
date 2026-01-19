//import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { JSX } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import { LoginForm } from "@/components";
import { getDashboardRoute } from "@/utils/routes";

import styles from "./page.module.css";

export default async function LoginPage(): Promise<JSX.Element> {
  // Handle potential JWT decryption errors gracefully
  // This can happen if NEXTAUTH_SECRET changed or cookies are corrupted
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    // If session decryption fails, treat as no session
    // User will need to log in again
    session = null;
  }

  if (session) {
    const dashboardRoute = getDashboardRoute(session.user.role);
    redirect(dashboardRoute);
  }

  return (
    <div className={styles.page}>
      {/* left 60% side image with blue overlay baked into perseverelogin.png */}
      <section className={styles.hero} aria-label="Persevere mission image" />

      {/* right 40% side centered Welcome + login form */}
      <main className={styles.main}>
        <div className={styles.panel}>
          <h1 className={styles.heading}>Welcome</h1>

          {/* connected to login in components */}
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
