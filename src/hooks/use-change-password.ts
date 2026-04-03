import { useCallback, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

type ChangePasswordData = {
  currentPassword: string;
  newPassword: string;
};

type UseChangePasswordResult = {
  isMutating: boolean;
  error: string | null;
  changePassword: (data: ChangePasswordData) => Promise<boolean>;
};

export function useChangePassword(
  role: "volunteer" | "staff",
): UseChangePasswordResult {
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const endpoint =
    role === "volunteer"
      ? "/api/volunteer/profile/password"
      : "/api/staff/profile/password";

  const changePassword = useCallback(
    async (data: ChangePasswordData): Promise<boolean> => {
      setIsMutating(true);
      setError(null);
      try {
        await apiClient.put(endpoint, data);
        return true;
      } catch (error_) {
        if (handleApiError(error_)) return false;
        const message =
          error_ instanceof Error
            ? error_.message
            : "Failed to change password";
        setError(message);
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [endpoint, handleApiError],
  );

  return { isMutating, error, changePassword };
}
