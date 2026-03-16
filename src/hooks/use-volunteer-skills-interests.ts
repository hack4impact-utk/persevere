import { useCallback, useState } from "react";

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

export type UseVolunteerSkillsInterestsResult = {
  skills: CatalogSkill[];
  interests: CatalogInterest[];
  isLoadingSkills: boolean;
  isLoadingInterests: boolean;
  error_or: string | null;
  fetchSkills: () => Promise<void>;
  fetchInterests: () => Promise<void>;
  addSkill: (skillId: number, proficiencyLevel: string) => Promise<void>;
  removeSkill: (skillId: number) => Promise<void>;
  addInterest: (interestId: number) => Promise<void>;
  removeInterest: (interestId: number) => Promise<void>;
};

export function useVolunteerSkillsInterests(): UseVolunteerSkillsInterestsResult {
  const [skills, setSkills] = useState<CatalogSkill[]>([]);
  const [interests, setInterests] = useState<CatalogInterest[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isLoadingInterests, setIsLoadingInterests] = useState(false);
  const [error_or, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const fetchSkills = useCallback(async (): Promise<void> => {
    setIsLoadingSkills(true);
    try {
      const json = await apiClient.get<{ data: CatalogSkill[] }>(
        "/api/volunteer/catalog/skills",
      );
      setSkills(json.data);
    } catch (error_) {
      handleApiError(error_, "Failed to load skills");
    } finally {
      setIsLoadingSkills(false);
    }
  }, [handleApiError]);

  const fetchInterests = useCallback(async (): Promise<void> => {
    setIsLoadingInterests(true);
    try {
      const json = await apiClient.get<{ data: CatalogInterest[] }>(
        "/api/volunteer/catalog/interests",
      );
      setInterests(json.data);
    } catch (error_) {
      handleApiError(error_, "Failed to load interests");
    } finally {
      setIsLoadingInterests(false);
    }
  }, [handleApiError]);

  const addSkill = useCallback(
    async (skillId: number, proficiencyLevel: string): Promise<void> => {
      try {
        await apiClient.post("/api/volunteer/profile/skills", {
          skillId,
          proficiencyLevel,
        });
      } catch (error_) {
        handleApiError(error_, "Failed to add skill");
      }
    },
    [handleApiError],
  );

  const removeSkill = useCallback(
    async (skillId: number): Promise<void> => {
      try {
        await apiClient.delete("/api/volunteer/profile/skills", {
          skillId,
        });
      } catch (error_) {
        handleApiError(error_, "Failed to remove skill");
      }
    },
    [handleApiError],
  );

  const addInterest = useCallback(
    async (interestId: number): Promise<void> => {
      try {
        await apiClient.post("/api/volunteer/profile/interests", {
          interestId,
        });
      } catch (error_) {
        handleApiError(error_, "Failed to add interest");
      }
    },
    [handleApiError],
  );

  const removeInterest = useCallback(
    async (interestId: number): Promise<void> => {
      try {
        await apiClient.delete("/api/volunteer/profile/interests", {
          interestId,
        });
      } catch (error_) {
        handleApiError(error_, "Failed to remove interest");
      }
    },
    [handleApiError],
  );

  return {
    skills,
    interests,
    isLoadingSkills,
    isLoadingInterests,
    error_or,
    fetchSkills,
    fetchInterests,
    addSkill,
    removeSkill,
    addInterest,
    removeInterest,
  };
}
