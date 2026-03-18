"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
        const AUTH_ERROR_MESSAGES: Record<string, string> = {
          CredentialsSignin: "Invalid email or password. Please try again.",
          AccessDenied: "Your account is not active. Please contact support.",
        };
        setError(
          AUTH_ERROR_MESSAGES[result.error] ??
            "Login failed. Please try again.",
        );
      } else if (result?.ok) {
        router.push("/home");
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (error_) {
      console.error("Login exception:", error_);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 420,
        mx: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
      >
        <TextField
          id="login-email"
          {...register("email")}
          type="email"
          label="Email Address"
          placeholder="Email Address"
          disabled={isLoading}
          error={!!errors.email}
          helperText={errors.email?.message}
          fullWidth
        />

        <Box>
          <TextField
            id="login-password"
            {...register("password")}
            type="password"
            label="Password"
            placeholder="Password"
            disabled={isLoading}
            error={!!errors.password}
            helperText={errors.password?.message}
            fullWidth
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
            <Link
              href="/auth/forgot-password"
              style={{
                color: "#9ca3af",
                textDecoration: "none",
                fontSize: 12,
              }}
            >
              Forgot Password?
            </Link>
          </Box>
        </Box>

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
            isLoading ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {isLoading ? "Signing in..." : "Login"}
        </Button>
      </Box>
    </Box>
  );
}
