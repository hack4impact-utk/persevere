"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
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

          <Box
            sx={{
              maxWidth: 420,
              mx: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {isSubmitted ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Alert severity="success">
                  If an account with that email exists, we&apos;ve sent a
                  password reset link. Please check your inbox.
                </Alert>
                <Button
                  variant="contained"
                  component={Link}
                  href="/auth/login"
                  size="large"
                  fullWidth
                  sx={{
                    py: 1.5,
                    borderRadius: 3,
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  Back to Login
                </Button>
              </Box>
            ) : (
              <>
                {error && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    {error}
                  </Alert>
                )}

                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", mb: 1 }}
                  >
                    Enter your email address and we&apos;ll send you a link to
                    reset your password.
                  </Typography>

                  <TextField
                    type="email"
                    label="Email Address"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    fullWidth
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isLoading}
                    fullWidth
                    sx={{
                      mt: 1,
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: 18,
                      fontWeight: 600,
                    }}
                    startIcon={
                      isLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : null
                    }
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </Box>

                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}
                >
                  <Link
                    href="/auth/login"
                    style={{
                      color: "#9ca3af",
                      textDecoration: "none",
                      fontSize: 12,
                    }}
                  >
                    Back to Login
                  </Link>
                </Box>
              </>
            )}
          </Box>
        </div>
      </main>
    </div>
  );
}
