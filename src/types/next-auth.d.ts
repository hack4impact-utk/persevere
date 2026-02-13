import "next-auth";

declare module "next-auth" {
  type Session = {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: "volunteer" | "staff" | "admin";
      volunteerType?: string | null;
      volunteerId?: number | null;
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
      volunteerType?: string | null;
      volunteerId?: number | null;
      isEmailVerified: boolean;
    };
    exp?: number;
  };
}
