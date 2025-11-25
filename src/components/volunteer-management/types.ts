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
};
