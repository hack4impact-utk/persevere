import { eq } from "drizzle-orm";
import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import db from "@/db";
import { users } from "@/db/schema";
import { env } from "@/utils/env";
import { verifyPassword } from "@/utils/server/password";

const authOptions: NextAuthOptions = {
  // Note: Using custom credentials provider instead of adapter
  // The DrizzleAdapter expects specific NextAuth table structure
  // Our normalized schema doesn't match NextAuth's expected format
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
  useSecureCookies: env.isProduction,
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

          // Auto-verify email on first sign-in if not already verified
          let isEmailVerified = user.isEmailVerified;
          if (!user.isEmailVerified) {
            // Update email verification status
            await db
              .update(users)
              .set({
                isEmailVerified: true,
                emailVerifiedAt: new Date(),
              })
              .where(eq(users.id, user.id));

            isEmailVerified = true;
          }

          // Determine user role
          let role: "volunteer" | "staff" | "admin" | "none" = "none";
          let volunteerType: "mentor" | "speaker" | "flexible" | null = null;

          if (user.staff?.admin) {
            role = "admin";
          } else if (user.staff) {
            role = "staff";
          } else if (user.volunteer) {
            role = "volunteer";
            volunteerType = user.volunteer.volunteerType as
              | "mentor"
              | "speaker"
              | "flexible"
              | null;
          }

          if (role === "none") {
            return null;
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role,
            volunteerType,
            volunteerId: user.volunteer?.id ?? null,
            isEmailVerified,
          };
        } catch (error) {
          console.error(
            "[authorize] Unexpected error for email:",
            credentials?.email,
            {
              errorType:
                error instanceof Error ? error.constructor.name : typeof error,
              message: error instanceof Error ? error.message : String(error),
            },
          );
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // user comes from authorize() which always returns our augmented User,
        // not AdapterUser (we don't use an adapter).
        const u = user as User;
        token.user = {
          id: u.id,
          email: u.email ?? "",
          name: u.name ?? "",
          role: u.role,
          volunteerType: u.volunteerType,
          volunteerId: u.volunteerId,
          isEmailVerified: u.isEmailVerified,
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
