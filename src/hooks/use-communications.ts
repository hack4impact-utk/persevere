import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { BulkCommunicationLog } from "@/components/staff/communications/types";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
  AuthenticationError,
  AuthorizationError,
  fetchCommunicationById,
  fetchCommunications,
} from "@/services/communications-client.service";

export type UseCommunicationsResult = {
  communications: BulkCommunicationLog[];
  selectedCommunication: BulkCommunicationLog | null;
  loading: boolean;
  error: string | null;
  loadCommunications: () => Promise<void>;
  selectCommunication: (id: number) => Promise<void>;
};

export function useCommunications(): UseCommunicationsResult {
  const router = useRouter();
  const [communications, setCommunications] = useState<BulkCommunicationLog[]>(
    [],
  );
  const [selectedCommunication, setSelectedCommunication] =
    useState<BulkCommunicationLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (error_ instanceof AuthenticationError) {
        router.push("/auth/login");
        return;
      }
      if (error_ instanceof AuthorizationError) {
        setError("Access denied");
        return;
      }

      console.error("Failed to fetch communications:", error_);
      setError("Failed to load communications. Please try again later.");
      setCommunications([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadCommunications();
  }, [loadCommunications]);

  const selectCommunication = useCallback(async (id: number): Promise<void> => {
    try {
      const communication = await fetchCommunicationById(id);
      setSelectedCommunication(communication);
    } catch (error_) {
      console.error("Failed to fetch communication:", error_);
      setError("Failed to load communication details.");
    }
  }, []);

  return {
    communications,
    selectedCommunication,
    loading,
    error,
    loadCommunications,
    selectCommunication,
  };
}
