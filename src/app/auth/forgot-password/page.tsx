"use client";

import Link from "next/link";
import { JSX, useState } from "react";

import styles from "../login/page.module.css";

export default function ForgotPasswordPage(): JSX.Element {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Something went wrong. Please try again.");
      }

      setIsSubmitted(true);
    } catch (error_) {
      setError(
        error_ instanceof Error
          ? error_.message
          : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-label="Persevere mission image" />

      <main className={styles.main}>
        <div className={styles.panel}>
          <h1 className={styles.heading}>Reset Password</h1>

          {isSubmitted ? (
            <div
              style={{
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <p style={{ color: "#333", fontSize: 16 }}>
                If an account with that email exists, we&apos;ve sent a password
                reset link. Please check your inbox.
              </p>
              <Link
                href="/auth/login"
                style={{
                  color: "#3b82f6",
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div
                  style={{
                    color: "#b91c1c",
                    backgroundColor: "#fee2e2",
                    borderRadius: 8,
                    padding: "0.75rem 1rem",
                    fontSize: 14,
                    marginBottom: "1rem",
                  }}
                >
                  {error}
                </div>
              )}

              <p
                style={{
                  color: "#6b7280",
                  fontSize: 14,
                  textAlign: "center",
                  marginBottom: "1.5rem",
                }}
              >
                Enter your email address and we&apos;ll send you a link to reset
                your password.
              </p>

              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                }}
              >
                <div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className={styles.input}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={styles.button}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                <Link
                  href="/auth/login"
                  style={{
                    color: "#9ca3af",
                    fontSize: 12,
                    textDecoration: "none",
                  }}
                >
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
