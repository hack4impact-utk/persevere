import { apiClient } from "@/lib/api-client";

import {
  type BulkCommunicationLog,
  type CommunicationFilters,
  type CommunicationResponse,
  type CreateCommunicationRequest,
  type RecipientType,
} from "./types";

export { AuthenticationError } from "@/lib/api-client";

/**
 * Fetches a paginated list of bulk communications with optional search and filtering.
 */
export async function fetchCommunications(
  filters: CommunicationFilters = {},
): Promise<CommunicationResponse> {
  const searchParams = new URLSearchParams();

  if (filters.search) searchParams.append("search", filters.search);
  if (filters.page) searchParams.append("page", String(filters.page));
  if (filters.limit) searchParams.append("limit", String(filters.limit));

  const data = await apiClient.get<{
    communications: {
      id: number;
      senderId: number;
      subject: string;
      body: string;
      recipientType: string;
      sentAt: string;
      status: string;
      sender: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
      };
    }[];
    total: number;
    page: number;
    limit: number;
  }>(`/api/staff/communications?${searchParams.toString()}`);

  return {
    communications: data.communications.map((comm) => ({
      ...comm,
      recipientType: comm.recipientType as RecipientType,
      sentAt: new Date(comm.sentAt),
    })),
    total: data.total,
    page: data.page,
    limit: data.limit,
  };
}

/**
 * Fetches a single communication by ID.
 */
export async function fetchCommunicationById(
  id: number,
): Promise<BulkCommunicationLog> {
  const data = await apiClient.get<{ communication: BulkCommunicationLog }>(
    `/api/staff/communications/${id}`,
  );
  return {
    ...data.communication,
    sentAt: new Date(data.communication.sentAt),
  };
}

/**
 * Creates a new bulk communication.
 */
export async function createCommunication(
  payload: CreateCommunicationRequest,
): Promise<BulkCommunicationLog> {
  const result = await apiClient.post<{ communication: BulkCommunicationLog }>(
    "/api/staff/communications",
    payload,
  );
  return {
    ...result.communication,
    sentAt: new Date(result.communication.sentAt),
  };
}
