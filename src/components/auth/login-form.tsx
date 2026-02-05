"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { JSX, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
/**
 * LoginForm
 *
 * Authentication form component. Handles user login with email/password
 * validation. NextAuth's redirect callback handles routing to role-specific dashboard.
 */
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm(): JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        // NextAuth's redirect callback will handle routing to role-specific dashboard
        globalThis.location.href = "/home";
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login exception:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

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
        onSubmit={handleSubmit(onSubmit)}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {/* Email */}
        <div style={{ textAlign: "left" }}>
          <input
            {...register("email")}
            type="email"
            placeholder="Email Address"
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
          {errors.email && (
            <span
              style={{
                color: "#b91c1c",
                fontSize: 12,
                marginTop: 4,
                display: "inline-block",
              }}
            >
              {errors.email.message}
            </span>
          )}
        </div>

        {/* Password + forgot password */}
        <div style={{ textAlign: "left" }}>
          <input
            {...register("password")}
            type="password"
            placeholder="Password"
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
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 6,
              fontSize: 12,
              color: "#9ca3af",
            }}
          >
            <Link
              href="/auth/forgot-password"
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                margin: 0,
                color: "#9ca3af",
                cursor: "pointer",
                textDecoration: "none",
                fontSize: "inherit",
              }}
            >
              Forgot Password?
            </Link>
          </div>
          {errors.password && (
            <span
              style={{
                color: "#b91c1c",
                fontSize: 12,
                marginTop: 4,
                display: "inline-block",
              }}
            >
              {errors.password.message}
            </span>
          )}
        </div>

        {/* Login button */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            marginTop: "0.75rem",
            width: "100%",
            padding: "1.05rem",
            borderRadius: 18,
            border: "none",
            backgroundColor: "#3b82f6",
            color: "#ffffff",
            fontSize: 18,
            fontWeight: 600,
            cursor: isLoading ? "default" : "pointer",
          }}
        >
          {isLoading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
