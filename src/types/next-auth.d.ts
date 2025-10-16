import "next-auth";

declare module "next-auth" {
  type Session = {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: "volunteer" | "staff" | "admin";
      volunteerType?: "mentor" | "speaker" | "flexible" | null;
      isEmailVerified: boolean;
      // Add other user properties
    };
    expires: string;
  };
}

declare module "next-auth/jwt" {
  type JWT = {
    user: {
      id: string;
      email: string;
      name: string;
      role: "volunteer" | "staff" | "admin";
      volunteerType?: "mentor" | "speaker" | "flexible" | null;
      isEmailVerified: boolean;
    };
    exp?: number;
  };
}
