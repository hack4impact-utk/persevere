import { useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

export type VolunteerCommunication = {
  id: number;
  subject: string;
  sentAt: Date;
  sender: { firstName: string; lastName: string } | null;
};

type State = {
  communications: VolunteerCommunication[];
  loading: boolean;
  error: string | null;
};

export function useVolunteerCommunications(): State {
  const [communications, setCommunications] = useState<
    VolunteerCommunication[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  useEffect(() => {
    let cancelled = false;

    async function run(): Promise<void> {
      try {
        setLoading(true);
        const res = await apiClient.get<{
          communications: {
            id: number;
            subject: string;
            sentAt: string;
            sender: { firstName: string; lastName: string } | null;
          }[];
        }>("/api/volunteer/communications");

        if (cancelled) return;

        setCommunications(
          res.communications.map((m) => ({ ...m, sentAt: new Date(m.sentAt) })),
        );
        setError(null);
      } catch (error_) {
        if (cancelled) return;
        setCommunications([]);
        handleApiError(error_, "Failed to load communications.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();

    return (): void => {
      cancelled = true;
    };
  }, [handleApiError]);

  return { communications, loading, error };
}
