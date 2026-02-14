import "next-auth";

declare module "next-auth" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface User {
    role: "volunteer" | "staff" | "admin";
    volunteerType?: "mentor" | "speaker" | "flexible" | null;
    volunteerId: number | null;
    isEmailVerified: boolean;
  }

  type Session = {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: "volunteer" | "staff" | "admin";
      volunteerType?: "mentor" | "speaker" | "flexible" | null;
      volunteerId: number | null;
      isEmailVerified: boolean;
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
      image?: string;
      role: "volunteer" | "staff" | "admin";
      volunteerType?: "mentor" | "speaker" | "flexible" | null;
      volunteerId: number | null;
      isEmailVerified: boolean;
    };
    exp?: number;
  };
}
