import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { JSX } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import { LoginForm } from "@/components";
import { getDashboardRoute } from "@/utils/routes";

import styles from "./page.module.css";

export default async function LoginPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (session) {
    const dashboardRoute = getDashboardRoute(session.user.role);
    redirect(dashboardRoute);
  }

  return (
    <div className={styles.page}>
      {/* LEFT PANEL – PERSEVERE BRANDING */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.logoRow}>
            <div className={styles.logoMark}>P</div>
            <span className={styles.logoText}>Persevere</span>
          </div>

          <div className={styles.heroTextBlock}>
            <h1 className={styles.heroTitle}>
              Helping Communities
              <br />
              Through Technology.
              <br />
              <span className={styles.heroTitleAccent}>Persevere.</span>
            </h1>

            <p className={styles.heroSubtitle}>
              The purpose of Persevere is to empower individuals impacted
              justice system through technology education, life skills, and
              skills, and wraparound support to reduce recidivism.
            </p>
          </div>
        </div>
      </section>

      {/* RIGHT PANEL – LOGIN CARD */}
      <main className={styles.main}>
        <div className={styles.cardWrapper}>
          <div className={styles.card}>
            {/* Back link */}
            <Link href="/" className={styles.backLink}>
              Back to website
            </Link>

            <header className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Welcome back!</h2>
              <p className={styles.cardDescription}>
                Log in to continue your work in Persevere.
              </p>
            </header>

            <div className={styles.sectionTitle}>Sign In</div>

            {/* Existing LoginForm (inputs + button) */}
            <div className={styles.formWrapper}>
              <LoginForm />
            </div>

            <footer className={styles.cardFooter}>
              <span className={styles.cardFooterText}>
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" className={styles.cardFooterLink}>
                  Sign up
                </Link>
              </span>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
