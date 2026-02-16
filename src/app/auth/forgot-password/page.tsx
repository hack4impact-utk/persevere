"use client";

import Link from "next/link";
import { JSX, useState } from "react";

import { apiClient } from "@/lib/api-client";

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
      await apiClient.post("/api/auth/forgot-password", { email });
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

          <div
            style={{
              maxWidth: "420px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {isSubmitted ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem 1rem",
                  backgroundColor: "#f0fdf4",
                  borderRadius: 12,
                  border: "1px solid #86efac",
                }}
              >
                <svg
                  style={{
                    width: 48,
                    height: 48,
                    margin: "0 auto 1rem",
                    color: "#16a34a",
                  }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p
                  style={{
                    color: "#166534",
                    fontSize: 16,
                    lineHeight: 1.5,
                    margin: "0 0 1.5rem",
                  }}
                >
                  If an account with that email exists, we&apos;ve sent a
                  password reset link. Please check your inbox.
                </p>
                <Link
                  href="/auth/login"
                  style={{
                    display: "inline-block",
                    padding: "0.75rem 1.5rem",
                    borderRadius: 14,
                    backgroundColor: "#3b82f6",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "background-color 0.15s ease",
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
                      marginBottom: "0.5rem",
                    }}
                  >
                    {error}
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                  }}
                >
                  <p
                    style={{
                      color: "#6b7280",
                      fontSize: 14,
                      textAlign: "center",
                      margin: "0 0 0.75rem",
                      lineHeight: 1.5,
                    }}
                  >
                    Enter your email address and we&apos;ll send you a link to
                    reset your password.
                  </p>
                  <div style={{ textAlign: "left" }}>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      style={{
                        width: "100%",
                        padding: "1.1rem 1.25rem",
                        fontSize: 16,
                        borderRadius: 14,
                        border: "1px solid #d1d5db",
                        outline: "none",
                        boxSizing: "border-box",
                        backgroundColor: "#ffffff",
                        color: "#111827",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      marginTop: "0.75rem",
                      width: "100%",
                      padding: "1.05rem",
                      borderRadius: 18,
                      border: "none",
                      backgroundColor: isLoading ? "#93c5fd" : "#3b82f6",
                      color: "#ffffff",
                      fontSize: 18,
                      fontWeight: 600,
                      cursor: isLoading ? "default" : "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
                  <Link
                    href="/auth/login"
                    style={{
                      color: "#9ca3af",
                      fontSize: 12,
                      textDecoration: "none",
                      transition: "color 0.15s ease",
                    }}
                  >
                    Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
