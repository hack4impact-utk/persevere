export type Volunteer = {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  volunteerType?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  backgroundCheckStatus?:
    | "not_required"
    | "pending"
    | "approved"
    | "rejected"
    | null;
  isAlumni?: boolean;
  totalHours?: number;
  profilePicture?: string | null;
};

export type VolunteersResponse = {
  volunteers: Volunteer[];
  total: number;
  page: number;
  limit: number;
};

export type VolunteerFilters = {
  search?: string;
  type?: string;
  alumni?: boolean;
  page?: number;
  limit?: number;
  emailVerified?: boolean;
  isActive?: boolean;
};
