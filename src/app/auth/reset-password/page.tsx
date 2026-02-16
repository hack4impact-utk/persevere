"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { JSX, Suspense, useState } from "react";

import { apiClient } from "@/lib/api-client";

import styles from "../login/page.module.css";

function ResetPasswordForm(): JSX.Element {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post("/api/auth/reset-password", { token, newPassword });
      setIsSuccess(true);
    } catch (error_) {
      setError(
        error_ instanceof Error
          ? error_.message
          : "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div
        style={{
          maxWidth: "420px",
          margin: "0 auto",
          textAlign: "center",
          padding: "2rem 1rem",
          backgroundColor: "#fef2f2",
          borderRadius: 12,
          border: "1px solid #fca5a5",
        }}
      >
        <p
          style={{
            color: "#991b1b",
            fontSize: 16,
            lineHeight: 1.5,
            margin: "0 0 1.5rem",
          }}
        >
          Invalid reset link. No token provided.
        </p>
        <Link
          href="/auth/forgot-password"
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
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div
        style={{
          maxWidth: "420px",
          margin: "0 auto",
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
          Your password has been reset successfully.
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
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "420px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
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
          Enter your new password below. Password must be at least 8 characters.
        </p>

        <div style={{ textAlign: "left" }}>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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

        <div style={{ textAlign: "left" }}>
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {isLoading ? "Resetting..." : "Reset Password"}
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
    </div>
  );
}

export default function ResetPasswordPage(): JSX.Element {
  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-label="Persevere mission image" />

      <main className={styles.main}>
        <div className={styles.panel}>
          <h1 className={styles.heading}>Enter New Password</h1>

          <Suspense
            fallback={
              <p style={{ textAlign: "center", color: "#6b7280" }}>
                Loading...
              </p>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
