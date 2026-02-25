export type OpportunityStatus = "open" | "full" | "completed" | "canceled";
export type RsvpStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "attended"
  | "no_show";

export type Opportunity = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  status: OpportunityStatus;
  maxVolunteers: number | null;
  isRecurring: boolean;
  rsvpCount: number;
  /** Always equals maxVolunteers - rsvpCount when maxVolunteers is non-null. */
  spotsRemaining: number | null;
};

export type RsvpItem = {
  opportunityId: number;
  rsvpStatus: RsvpStatus;
  rsvpAt: string;
  opportunityTitle: string | null;
  opportunityLocation: string | null;
  opportunityStartDate: string | null;
  opportunityEndDate: string | null;
  opportunityStatus: OpportunityStatus | null;
};
