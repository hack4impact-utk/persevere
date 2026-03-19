import { useCallback, useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";
import type {
  DocumentSignature,
  OnboardingDocument,
} from "@/services/onboarding-documents.service";

export type UseOnboardingDocumentsResult = {
  documents: OnboardingDocument[];
  signatures: DocumentSignature[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  fetchSignatures: () => Promise<void>;
  // Staff mutations
  createDocument: (data: CreateDocumentInput) => Promise<void>;
  updateDocument: (id: number, data: UpdateDocumentInput) => Promise<void>;
  deleteDocument: (id: number) => Promise<void>;
  uploadFile: (file: File) => Promise<string>;
  // Volunteer mutation
  signDocument: (documentId: number) => Promise<void>;
};

export type CreateDocumentInput = {
  title: string;
  type: "pdf" | "video" | "link";
  url: string;
  description?: string;
  required?: boolean;
  sortOrder?: number;
};

export type UpdateDocumentInput = Partial<CreateDocumentInput> & {
  isActive?: boolean;
};

export function useOnboardingDocuments(
  documentsApiPath = "/api/staff/onboarding/documents",
): UseOnboardingDocumentsResult {
  const [documents, setDocuments] = useState<OnboardingDocument[]>([]);
  const [signatures, setSignatures] = useState<DocumentSignature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const refetch = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<{ data: OnboardingDocument[] }>(
        documentsApiPath,
      );
      setDocuments(result.data);
    } catch (error_) {
      if (handleApiError(error_, "Failed to load documents")) return;
    } finally {
      setLoading(false);
    }
  }, [handleApiError, documentsApiPath]);

  const fetchSignatures = useCallback(async (): Promise<void> => {
    try {
      const result = await apiClient.get<{ data: DocumentSignature[] }>(
        "/api/volunteer/onboarding/signatures",
      );
      setSignatures(result.data);
    } catch (error_) {
      handleApiError(error_, "Failed to load signatures");
    }
  }, [handleApiError]);

  const createDocument = useCallback(
    async (data: CreateDocumentInput): Promise<void> => {
      try {
        await apiClient.post("/api/staff/onboarding/documents", data);
        void refetch();
      } catch (error_) {
        if (handleApiError(error_, "Failed to create document")) return;
      }
    },
    [refetch, handleApiError],
  );

  const updateDocument = useCallback(
    async (id: number, data: UpdateDocumentInput): Promise<void> => {
      try {
        await apiClient.put(`/api/staff/onboarding/documents/${id}`, data);
        void refetch();
      } catch (error_) {
        if (handleApiError(error_, "Failed to update document")) return;
      }
    },
    [refetch, handleApiError],
  );

  const deleteDocument = useCallback(
    async (id: number): Promise<void> => {
      try {
        await apiClient.delete(`/api/staff/onboarding/documents/${id}`);
        void refetch();
      } catch (error_) {
        if (handleApiError(error_, "Failed to delete document")) return;
      }
    },
    [refetch, handleApiError],
  );

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const result = await apiClient.postForm<{ url: string }>(
      "/api/staff/onboarding/documents/upload",
      formData,
    );
    return result.url;
  }, []);

  const signDocument = useCallback(
    async (documentId: number): Promise<void> => {
      try {
        await apiClient.post("/api/volunteer/onboarding/sign-document", {
          documentId,
        });
        void fetchSignatures();
      } catch (error_) {
        if (handleApiError(error_, "Failed to sign document")) return;
      }
    },
    [fetchSignatures, handleApiError],
  );

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    documents,
    signatures,
    loading,
    error,
    refetch,
    fetchSignatures,
    createDocument,
    updateDocument,
    deleteDocument,
    uploadFile,
    signDocument,
  };
}

export {
  type DocumentSignature,
  type OnboardingDocument,
} from "@/services/onboarding-documents.service";
