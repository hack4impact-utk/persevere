import { useSnackbar } from "notistack";
import { useCallback, useState } from "react";

import { apiClient } from "@/lib/api-client";

import { useApiErrorHandler } from "./use-api-error-handler";

export function useRsvpMutation(): {
  toggleRsvp: (
    opportunityId: number,
    currentlyRsvped: boolean,
  ) => Promise<boolean>;
  isMutating: boolean;
  error: string | null;
} {
  const [isMutating, setIsMutating] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const toggleRsvp = useCallback(
    async (
      opportunityId: number,
      currentlyRsvped: boolean,
    ): Promise<boolean> => {
      setIsMutating(true);
      setError(null);

      try {
        const url = `/api/volunteer/opportunities/${opportunityId}/rsvp`;
        await (currentlyRsvped ? apiClient.delete(url) : apiClient.post(url));

        const newIsRsvped = !currentlyRsvped;
        enqueueSnackbar(newIsRsvped ? "RSVP confirmed!" : "RSVP cancelled.", {
          variant: newIsRsvped ? "success" : "info",
        });

        return true;
      } catch (error_) {
        // useApiErrorHandler will handle AuthenticationError (redirect) and AuthorizationError
        if (!handleApiError(error_, "Failed to update RSVP status.")) {
          console.error("[useRsvpMutation] toggleRsvp:", error_);
        }
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [enqueueSnackbar, handleApiError],
  );

  return { toggleRsvp, isMutating, error };
}
