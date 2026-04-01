import "next-auth";

export type UserRole = "volunteer" | "staff" | "admin";
export type VolunteerType = string;

export type SessionUserPayload = {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  volunteerType?: VolunteerType | null;
  volunteerId: number | null;
  isEmailVerified: boolean;
};

declare module "next-auth" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- NextAuth requires interface augmentation
  interface User {
    role: UserRole;
    volunteerType?: VolunteerType | null;
    volunteerId: number | null;
    isEmailVerified: boolean;
  }

  type Session = {
    user: SessionUserPayload;
    expires: string;
  };
}

declare module "next-auth/jwt" {
  type JWT = {
    user: SessionUserPayload;
    exp?: number;
  };
}
