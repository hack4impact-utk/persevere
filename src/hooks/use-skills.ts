import { useCallback, useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

export type CatalogSkill = {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
};

export type CatalogInterest = {
  id: number;
  name: string;
  description: string | null;
};

export type UseSkillsResult = {
  skills: CatalogSkill[];
  interests: CatalogInterest[];
  loadingSkills: boolean;
  loadingInterests: boolean;
  error: string | null;
  fetchSkills: () => Promise<void>;
  fetchInterests: () => Promise<void>;
  // Volunteer-specific actions
  addSkill: (
    volunteerId: number,
    skillId: number,
    proficiency?: string,
  ) => Promise<void>;
  removeSkill: (volunteerId: number, skillId: number) => Promise<void>;
  addInterest: (volunteerId: number, interestId: number) => Promise<void>;
  removeInterest: (volunteerId: number, interestId: number) => Promise<void>;
  // Catalog admin actions
  createSkill: (
    name: string,
    description?: string,
    category?: string,
  ) => Promise<void>;
  updateSkill: (
    id: number,
    name: string,
    description?: string,
    category?: string,
  ) => Promise<void>;
  deleteSkill: (id: number) => Promise<void>;
  createInterest: (name: string, description?: string) => Promise<void>;
  updateInterest: (
    id: number,
    name: string,
    description?: string,
  ) => Promise<void>;
  deleteInterest: (id: number) => Promise<void>;
};

export function useSkills(): UseSkillsResult {
  const [skills, setSkills] = useState<CatalogSkill[]>([]);
  const [interests, setInterests] = useState<CatalogInterest[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [loadingInterests, setLoadingInterests] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const fetchSkills = useCallback(async (): Promise<void> => {
    setLoadingSkills(true);
    try {
      const json = await apiClient.get<{ data: CatalogSkill[] }>(
        "/api/staff/skills",
      );
      setSkills(json.data);
    } catch (error) {
      handleApiError(error, "An unexpected error occurred.");
    } finally {
      setLoadingSkills(false);
    }
  }, [handleApiError]);

  const fetchInterests = useCallback(async (): Promise<void> => {
    setLoadingInterests(true);
    try {
      const json = await apiClient.get<{ data: CatalogInterest[] }>(
        "/api/staff/interests",
      );
      setInterests(json.data);
    } catch (error) {
      handleApiError(error, "An unexpected error occurred.");
    } finally {
      setLoadingInterests(false);
    }
  }, [handleApiError]);

  const addSkill = useCallback(
    async (
      volunteerId: number,
      skillId: number,
      proficiency?: string,
    ): Promise<void> => {
      try {
        await apiClient.post(`/api/staff/volunteers/${volunteerId}/skills`, {
          skillId,
          level: proficiency ?? "beginner",
        });
      } catch (error) {
        handleApiError(error, "An unexpected error occurred.");
      }
    },
    [handleApiError],
  );

  const removeSkill = useCallback(
    async (volunteerId: number, skillId: number): Promise<void> => {
      try {
        await apiClient.delete(
          `/api/staff/volunteers/${volunteerId}/skills/${skillId}`,
        );
      } catch (error) {
        handleApiError(error, "An unexpected error occurred.");
      }
    },
    [handleApiError],
  );

  const addInterest = useCallback(
    async (volunteerId: number, interestId: number): Promise<void> => {
      try {
        await apiClient.post(`/api/staff/volunteers/${volunteerId}/interests`, {
          interestId,
        });
      } catch (error) {
        handleApiError(error, "An unexpected error occurred.");
      }
    },
    [handleApiError],
  );

  const removeInterest = useCallback(
    async (volunteerId: number, interestId: number): Promise<void> => {
      try {
        await apiClient.delete(
          `/api/staff/volunteers/${volunteerId}/interests/${interestId}`,
        );
      } catch (error) {
        handleApiError(error, "An unexpected error occurred.");
      }
    },
    [handleApiError],
  );

  const createSkill = useCallback(
    async (
      name: string,
      description?: string,
      category?: string,
    ): Promise<void> => {
      try {
        await apiClient.post("/api/staff/skills", {
          name,
          description,
          category,
        });
      } catch (error) {
        handleApiError(error, "An unexpected error occurred.");
      }
    },
    [handleApiError],
  );

  const updateSkill = useCallback(
    async (
      id: number,
      name: string,
      description?: string,
      category?: string,
    ): Promise<void> => {
      try {
        await apiClient.put(`/api/staff/skills/${id}`, {
          name,
          description,
          category,
        });
      } catch (error) {
        handleApiError(error, "An unexpected error occurred.");
      }
    },
    [handleApiError],
  );

  const deleteSkill = useCallback(
    async (id: number): Promise<void> => {
      try {
        await apiClient.delete(`/api/staff/skills/${id}`);
      } catch (error) {
        handleApiError(error, "An unexpected error occurred.");
      }
    },
    [handleApiError],
  );

  const createInterest = useCallback(
    async (name: string, description?: string): Promise<void> => {
      try {
        await apiClient.post("/api/staff/interests", { name, description });
      } catch (error) {
        handleApiError(error, "An unexpected error occurred.");
      }
    },
    [handleApiError],
  );

  const updateInterest = useCallback(
    async (id: number, name: string, description?: string): Promise<void> => {
      try {
        await apiClient.put(`/api/staff/interests/${id}`, {
          name,
          description,
        });
      } catch (error) {
        handleApiError(error, "An unexpected error occurred.");
      }
    },
    [handleApiError],
  );

  const deleteInterest = useCallback(
    async (id: number): Promise<void> => {
      try {
        await apiClient.delete(`/api/staff/interests/${id}`);
      } catch (error) {
        handleApiError(error, "An unexpected error occurred.");
      }
    },
    [handleApiError],
  );

  useEffect(() => {
    void fetchSkills();
    void fetchInterests();
  }, [fetchSkills, fetchInterests]);

  return {
    skills,
    interests,
    loadingSkills,
    loadingInterests,
    error,
    fetchSkills,
    fetchInterests,
    addSkill,
    removeSkill,
    addInterest,
    removeInterest,
    createSkill,
    updateSkill,
    deleteSkill,
    createInterest,
    updateInterest,
    deleteInterest,
  };
}
