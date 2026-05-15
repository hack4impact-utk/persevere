/**
 * Types for communication components
 */

export type RecipientType = "volunteers" | "staff" | "both";

export type BulkCommunicationLog = {
  id: number;
  senderId: number;
  subject: string;
  body: string;
  recipientType: RecipientType;
  sentAt: Date;
  status: string;
  sender?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export type CreateCommunicationRequest = {
  subject: string;
  body: string;
  recipientType: RecipientType;
};

export type CommunicationFilters = {
  page?: number;
  limit?: number;
  search?: string;
};

export type CommunicationResponse = {
  communications: BulkCommunicationLog[];
  total: number;
  page: number;
  limit: number;
};
