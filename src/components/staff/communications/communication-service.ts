import { AuthenticationError } from "@/lib/api-client";

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

  const response = await fetch(
    `/api/staff/communications?${searchParams.toString()}`,
    {
      cache: "no-store",
      next: { revalidate: 0 },
    },
  );

  if (response.status === 401 || response.status === 403) {
    throw new AuthenticationError("Unauthorized access");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch communications");
  }

  const data = (await response.json()) as {
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
  };
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
  const response = await fetch(`/api/staff/communications/${id}`, {
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (response.status === 401 || response.status === 403) {
    throw new AuthenticationError("Unauthorized access");
  }

  if (response.status === 404) {
    throw new Error("Communication not found");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch communication");
  }

  const data = await response.json();
  return {
    ...data.communication,
    sentAt: new Date(data.communication.sentAt),
  };
}

/**
 * Creates a new bulk communication.
 */
export async function createCommunication(
  data: CreateCommunicationRequest,
): Promise<BulkCommunicationLog> {
  const response = await fetch("/api/staff/communications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response.status === 401 || response.status === 403) {
    throw new AuthenticationError("Unauthorized access");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create communication");
  }

  const result = await response.json();
  return {
    ...result.communication,
    sentAt: new Date(result.communication.sentAt),
  };
}
