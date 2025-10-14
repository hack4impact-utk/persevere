"use client";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (data: LoginFormData) => {
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
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
      <h2>Sign In</h2>
      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div>
          <input 
            {...register("email")} 
            type="email" 
            placeholder="Email" 
            style={{ width: "100%", padding: "8px" }}
            disabled={isLoading}
          />
          {errors.email && <span style={{ color: "red" }}>{errors.email.message}</span>}
        </div>
        
        <div>
          <input 
            {...register("password")} 
            type="password" 
            placeholder="Password" 
            style={{ width: "100%", padding: "8px" }}
            disabled={isLoading}
          />
          {errors.password && <span style={{ color: "red" }}>{errors.password.message}</span>}
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          style={{ padding: "10px", backgroundColor: "#0070f3", color: "white", border: "none", borderRadius: "4px" }}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
