export type Staff = {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isAdmin: boolean;
  profilePicture?: string | null;
  createdAt?: Date;
};

export type StaffResponse = {
  staff: Staff[];
  total: number;
  page: number;
  limit: number;
};

export type StaffFilters = {
  search?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
  emailVerified?: boolean;
  role?: "admin" | "staff";
};
