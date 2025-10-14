import "next-auth";

declare module "next-auth" {
  type Session = {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: "mentor" | "guest_speaker" | "flexible" | "staff" | "admin";
      isEmailVerified: boolean;
      // Add other user properties
    };
  };
}

declare module "next-auth/jwt" {
  type JWT = {
    user: {
      id: string;
      email: string;
      name: string;
      role: "mentor" | "guest_speaker" | "flexible" | "staff" | "admin";
      isEmailVerified: boolean;
    };
  };
}
