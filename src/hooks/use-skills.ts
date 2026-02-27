import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  apiClient,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/api-client";

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
  isLoadingSkills: boolean;
  isLoadingInterests: boolean;
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
  const router = useRouter();
  const [skills, setSkills] = useState<CatalogSkill[]>([]);
  const [interests, setInterests] = useState<CatalogInterest[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isLoadingInterests, setIsLoadingInterests] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback(
    (err: unknown): void => {
      if (err instanceof AuthenticationError) {
        router.push("/auth/login");
      } else if (err instanceof AuthorizationError) {
        setError("Access denied");
      } else {
        console.error("[useSkills]", err);
        setError("An unexpected error occurred.");
      }
    },
    [router],
  );

  const fetchSkills = useCallback(async (): Promise<void> => {
    setIsLoadingSkills(true);
    try {
      const json = await apiClient.get<{ data: CatalogSkill[] }>(
        "/api/staff/skills",
      );
      setSkills(json.data);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoadingSkills(false);
    }
  }, [handleError]);

  const fetchInterests = useCallback(async (): Promise<void> => {
    setIsLoadingInterests(true);
    try {
      const json = await apiClient.get<{ data: CatalogInterest[] }>(
        "/api/staff/interests",
      );
      setInterests(json.data);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoadingInterests(false);
    }
  }, [handleError]);

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
        handleError(error);
      }
    },
    [handleError],
  );

  const removeSkill = useCallback(
    async (volunteerId: number, skillId: number): Promise<void> => {
      try {
        await apiClient.delete(
          `/api/staff/volunteers/${volunteerId}/skills/${skillId}`,
        );
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  const addInterest = useCallback(
    async (volunteerId: number, interestId: number): Promise<void> => {
      try {
        await apiClient.post(`/api/staff/volunteers/${volunteerId}/interests`, {
          interestId,
        });
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  const removeInterest = useCallback(
    async (volunteerId: number, interestId: number): Promise<void> => {
      try {
        await apiClient.delete(
          `/api/staff/volunteers/${volunteerId}/interests/${interestId}`,
        );
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
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
        handleError(error);
      }
    },
    [handleError],
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
        handleError(error);
      }
    },
    [handleError],
  );

  const deleteSkill = useCallback(
    async (id: number): Promise<void> => {
      try {
        await apiClient.delete(`/api/staff/skills/${id}`);
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  const createInterest = useCallback(
    async (name: string, description?: string): Promise<void> => {
      try {
        await apiClient.post("/api/staff/interests", { name, description });
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  const updateInterest = useCallback(
    async (id: number, name: string, description?: string): Promise<void> => {
      try {
        await apiClient.put(`/api/staff/interests/${id}`, {
          name,
          description,
        });
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  const deleteInterest = useCallback(
    async (id: number): Promise<void> => {
      try {
        await apiClient.delete(`/api/staff/interests/${id}`);
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  useEffect(() => {
    void fetchSkills();
    void fetchInterests();
  }, [fetchSkills, fetchInterests]);

  return {
    skills,
    interests,
    isLoadingSkills,
    isLoadingInterests,
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
