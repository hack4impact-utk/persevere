import { useCallback, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";
import type { ImportResult } from "@/services/volunteer-import.service";

export type UseVolunteerImportResult = {
  importing: boolean;
  result: ImportResult | null;
  error: string | null;
  importFile: (file: File) => Promise<void>;
  reset: () => void;
};

export function useVolunteerImport(): UseVolunteerImportResult {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApiError = useApiErrorHandler(setError);

  const importFile = useCallback(
    async (file: File): Promise<void> => {
      setImporting(true);
      setError(null);
      setResult(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await apiClient.postForm<{ data: ImportResult }>(
          "/api/staff/volunteers/import",
          formData,
        );
        setResult(response.data);
      } catch (error_) {
        handleApiError(error_, "Import failed");
      } finally {
        setImporting(false);
      }
    },
    [handleApiError],
  );

  const reset = useCallback((): void => {
    setImporting(false);
    setResult(null);
    setError(null);
  }, []);

  return { importing, result, error, importFile, reset };
}
