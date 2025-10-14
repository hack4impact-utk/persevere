import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: "mentor" | "guest_speaker" | "flexible" | "staff" | "admin";
      isEmailVerified: boolean;
      // Add other user properties
    };
  }
}
