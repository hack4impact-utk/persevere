import { useCallback, useEffect, useRef, useState } from "react";

import type {
  BulkCommunicationLog,
  CreateCommunicationRequest,
} from "@/components/staff/communications/types";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
  createCommunication as createCommunicationApi,
  fetchCommunicationById,
  fetchCommunications,
} from "@/services/communications-client.service";

export type UseCommunicationsResult = {
  communications: BulkCommunicationLog[];
  selectedCommunication: BulkCommunicationLog | null;
  loading: boolean;
  isMutating: boolean;
  error: string | null;
  loadCommunications: () => Promise<void>;
  selectCommunication: (id: number) => Promise<void>;
  sendCommunication: (payload: CreateCommunicationRequest) => Promise<{
    communication: BulkCommunicationLog;
    emailSent?: boolean;
    emailError?: boolean;
    recipientCount?: number;
  } | null>;
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
  const handleApiError = useApiErrorHandler(setError);

  const isFirstLoad = useRef(true);

  const loadCommunications = useCallback(async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetchCommunications({
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
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
  }, [handleApiError]);

  useEffect(() => {
    if (skip) return;
    void loadCommunications();
  }, [loadCommunications, skip]);

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
        const result = await createCommunicationApi(payload);
        void loadCommunications();
        return result;
      } catch (error_) {
        if (handleApiError(error_)) return null;
        throw error_;
      } finally {
        setIsMutating(false);
      }
    },
    [handleApiError, loadCommunications],
  );

  return {
    communications,
    selectedCommunication,
    loading,
    isMutating,
    error,
    loadCommunications,
    selectCommunication,
    sendCommunication,
  };
}
