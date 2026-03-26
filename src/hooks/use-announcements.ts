import { useEffect, useRef, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

export type AnnouncementItem = {
  id: number;
  subject: string;
  body: string;
  sentAt: string;
};

export type UseAnnouncementsResult = {
  announcements: AnnouncementItem[];
  loading: boolean;
  error: string | null;
};

export function useAnnouncements(): UseAnnouncementsResult {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);
  const handleApiErrorRef = useRef(handleApiError);
  handleApiErrorRef.current = handleApiError;

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const result = await apiClient.get<{ data: AnnouncementItem[] }>(
          "/api/volunteer/announcements",
        );
        if (!cancelled) setAnnouncements(result.data);
      } catch (error_) {
        if (cancelled) return;
        handleApiErrorRef.current(error_, "Failed to load announcements");
        setAnnouncements([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return (): void => {
      cancelled = true;
    };
  }, []);

  return { announcements, loading, error };
}
