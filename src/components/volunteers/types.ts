export interface Volunteer {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  volunteerType?: string;
  isActive: boolean;
}

export interface VolunteersResponse {
  volunteers: Volunteer[];
  total: number;
  page: number;
  limit: number;
}

export interface VolunteerFilters {
  search?: string;
  type?: string;
  alumni?: boolean;
  page?: number;
  limit?: number;
}