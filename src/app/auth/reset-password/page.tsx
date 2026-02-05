"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { JSX, Suspense, useState } from "react";

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
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setIsSuccess(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#b91c1c", fontSize: 16, marginBottom: "1rem" }}>
          Invalid reset link. No token provided.
        </p>
        <Link
          href="/auth/forgot-password"
          style={{
            color: "#3b82f6",
            fontSize: 14,
            textDecoration: "none",
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
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <p style={{ color: "#333", fontSize: 16 }}>
          Your password has been reset successfully.
        </p>
        <Link
          href="/auth/login"
          style={{
            display: "inline-block",
            backgroundColor: "#3b82f6",
            color: "#ffffff",
            textDecoration: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: 999,
            fontWeight: 500,
            fontSize: 16,
          }}
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
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
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={isLoading}
            className={styles.input}
          />
        </div>

        <div>
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            className={styles.input}
          />
        </div>

        <button type="submit" disabled={isLoading} className={styles.button}>
          {isLoading ? "Resetting..." : "Reset Password"}
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
