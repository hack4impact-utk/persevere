import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import db from "@/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
  volunteers,
} from "@/db/schema";
import { verifyPassword } from "@/utils/password";

const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
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

          // Fetch user from database
          const volunteer = await db.query.volunteers.findFirst({
            where: eq(volunteers.email, credentials.email),
          });

          if (!volunteer) {
            return null;
          }

          // Verify password
          const isValid = await verifyPassword(
            credentials.password,
            volunteer.password,
          );
          if (!isValid) {
            return null;
          }

          // Ensure user exists in NextAuth user table
          const existingUser = await db.query.users.findFirst({
            where: eq(users.id, volunteer.id.toString()),
          });

          if (!existingUser) {
            // Create user in NextAuth user table
            await db.insert(users).values({
              id: volunteer.id.toString(),
              name: `${volunteer.firstName} ${volunteer.lastName}`,
              email: volunteer.email,
              emailVerified: volunteer.isEmailVerified ? new Date() : null,
            });
          }

          return {
            id: volunteer.id.toString(),
            email: volunteer.email,
            name: `${volunteer.firstName} ${volunteer.lastName}`,
            role: volunteer.role,
            isEmailVerified: volunteer.isEmailVerified,
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
              role: "mentor" | "guest_speaker" | "flexible" | "staff" | "admin";
              isEmailVerified: boolean;
            }
          ).role,
          isEmailVerified: (
            user as unknown as {
              role: "mentor" | "guest_speaker" | "flexible" | "staff" | "admin";
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
      // Always redirect to dashboard after login
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
