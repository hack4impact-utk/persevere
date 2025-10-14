import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import db from "@/db";
import { volunteers } from "@/db/schema";
import { verifyPassword } from "@/utils/password";

const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        // Fetch user from database
        const user = await db.query.volunteers.findFirst({
          where: eq(volunteers.email, credentials.email),
        });

        if (!user) throw new Error("Invalid credentials");

        // Verify password
        const isValid = await verifyPassword(
          credentials.password,
          user.password,
        );
        if (!isValid) throw new Error("Invalid credentials");

        return {
          id: user.id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        };
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
      }
      return token;
    },
    session({ session, token }) {
      if (token.user) {
        session.user = token.user;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
