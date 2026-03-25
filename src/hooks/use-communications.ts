import { useCallback, useEffect, useRef, useState } from "react";

import type {
  BulkCommunicationLog,
  CommunicationFilters,
  CommunicationResponse,
  CreateCommunicationRequest,
  RecipientType,
} from "@/components/staff/communications/types";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

async function fetchCommunications(
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

async function fetchCommunicationById(
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

async function createCommunication(
  payload: CreateCommunicationRequest,
): Promise<{
  communication: BulkCommunicationLog;
  emailSent?: boolean;
  emailError?: boolean;
  recipientCount?: number;
}> {
  const result = await apiClient.post<{
    communication: BulkCommunicationLog;
    emailSent?: boolean;
    emailError?: boolean;
    recipientCount?: number;
  }>("/api/staff/communications", payload);

  return {
    communication: {
      ...result.communication,
      sentAt: new Date(result.communication.sentAt),
    },
    emailSent: result.emailSent,
    emailError: result.emailError,
    recipientCount: result.recipientCount,
  };
}

export type UseCommunicationsResult = {
  communications: BulkCommunicationLog[];
  selectedCommunication: BulkCommunicationLog | null;
  loading: boolean;
  isMutating: boolean;
  error: string | null;
  search: string;
  setSearch: (s: string) => void;
  loadCommunications: (filters?: CommunicationFilters) => Promise<void>;
  selectCommunication: (id: number) => Promise<void>;
  sendCommunication: (payload: CreateCommunicationRequest) => Promise<{
    communication: BulkCommunicationLog;
    emailSent?: boolean;
    emailError?: boolean;
    recipientCount?: number;
  } | null>;
  deleteCommunication: (id: number) => Promise<boolean>;
};

export function useCommunications({
  skip = false,
}: { skip?: boolean } = {}): UseCommunicationsResult {
  const [communications, setCommunications] = useState<BulkCommunicationLog[]>(
    [],
  );
  const [selectedCommunication, setSelectedCommunication] =
    useState<BulkCommunicationLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const handleApiError = useApiErrorHandler(setError);

  const isFirstLoad = useRef(true);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCommunications = useCallback(
    async (filters: CommunicationFilters = {}): Promise<void> => {
      setError(null);
      setLoading(true);
      try {
        const response = await fetchCommunications({
          page: 1,
          limit: DEFAULT_PAGE_SIZE,
          ...filters,
        });
        const list = response.communications ?? [];
        setCommunications(list);

        // Auto-select first communication on initial load
        if (isFirstLoad.current && list.length > 0) {
          setSelectedCommunication(list[0]);
          isFirstLoad.current = false;
        }
      } catch (error_) {
        if (
          handleApiError(
            error_,
            "Failed to load communications. Please try again later.",
          )
        )
          return;
        setCommunications([]);
      } finally {
        setLoading(false);
      }
    },
    [handleApiError],
  );

  // Initial load
  useEffect(() => {
    if (skip) return;
    void loadCommunications();
  }, [loadCommunications, skip]);

  // Debounced search — skip on initial render
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (skip) return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      void loadCommunications({ search: search || undefined });
    }, 300);
    return (): void => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search, loadCommunications, skip]);

  const selectCommunication = useCallback(async (id: number): Promise<void> => {
    try {
      const communication = await fetchCommunicationById(id);
      setSelectedCommunication(communication);
    } catch (error_) {
      console.error("Failed to fetch communication:", error_);
      setError("Failed to load communication details.");
    }
  }, []);

  const sendCommunication = useCallback(
    async (
      payload: CreateCommunicationRequest,
    ): Promise<{
      communication: BulkCommunicationLog;
      emailSent?: boolean;
      emailError?: boolean;
      recipientCount?: number;
    } | null> => {
      setIsMutating(true);
      try {
        const result = await createCommunication(payload);
        void loadCommunications({ search: search || undefined });
        return result;
      } catch (error_) {
        if (handleApiError(error_)) return null;
        throw error_;
      } finally {
        setIsMutating(false);
      }
    },
    [handleApiError, loadCommunications, search],
  );

  const deleteCommunication = useCallback(
    async (id: number): Promise<boolean> => {
      setIsMutating(true);
      try {
        await apiClient.delete(`/api/staff/communications/${id}`);
        setSelectedCommunication(null);
        void loadCommunications({ search: search || undefined });
        return true;
      } catch (error_) {
        if (!handleApiError(error_)) {
          console.error("[useCommunications] deleteCommunication:", error_);
        }
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [handleApiError, loadCommunications, search],
  );

  return {
    communications,
    selectedCommunication,
    loading,
    isMutating,
    error,
    search,
    setSearch,
    loadCommunications,
    selectCommunication,
    sendCommunication,
    deleteCommunication,
  };
}
