import { eq } from "drizzle-orm";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import db from "@/db";
import { users } from "@/db/schema";
import { env } from "@/utils/env";
import { verifyPassword } from "@/utils/password";

const authOptions: NextAuthOptions = {
  // Note: Using custom credentials provider instead of adapter
  // The DrizzleAdapter expects specific NextAuth table structure
  // Our normalized schema doesn't match NextAuth's expected format
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
  useSecureCookies: false,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Fetch user from database with all role information
          const user = await db.query.users.findFirst({
            where: eq(users.email, credentials.email),
            with: {
              volunteer: true,
              staff: {
                with: {
                  admin: true,
                },
              },
            },
          });

          if (!user) {
            return null;
          }

          // Verify password
          const isValid = await verifyPassword(
            credentials.password,
            user.password,
          );
          if (!isValid) {
            return null;
          }

          // Determine user role
          let role = "none";
          let volunteerType = null;

          if (user.staff?.admin) {
            role = "admin";
          } else if (user.staff) {
            role = "staff";
          } else if (user.volunteer) {
            role = "volunteer";
            volunteerType = user.volunteer.volunteerType;
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role,
            volunteerType,
            isEmailVerified: user.isEmailVerified,
          };
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.user = {
          id: user.id,
          email: user.email || "",
          name: user.name || "",
          role: (
            user as unknown as {
              role: "volunteer" | "staff" | "admin";
              volunteerType?: "mentor" | "speaker" | "flexible" | null;
              isEmailVerified: boolean;
            }
          ).role,
          volunteerType: (
            user as unknown as {
              role: "volunteer" | "staff" | "admin";
              volunteerType?: "mentor" | "speaker" | "flexible" | null;
              isEmailVerified: boolean;
            }
          ).volunteerType,
          isEmailVerified: (
            user as unknown as {
              role: "volunteer" | "staff" | "admin";
              volunteerType?: "mentor" | "speaker" | "flexible" | null;
              isEmailVerified: boolean;
            }
          ).isEmailVerified,
        };
        // Set expiration time (30 days from now)
        token.exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      }
      return token;
    },
    session({ session, token }) {
      if (token.user) {
        session.user = token.user;
      }
      // Set session expiration time
      if (token.exp) {
        session.expires = new Date(token.exp * 1000).toISOString();
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      // If a specific URL is provided and valid, use it
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;

      // Default redirect to /home which will route to role-specific dashboard
      // The /home route uses server-side session to determine role
      return `${baseUrl}/home`;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: env.nextAuthSecret,
};

export default authOptions;
