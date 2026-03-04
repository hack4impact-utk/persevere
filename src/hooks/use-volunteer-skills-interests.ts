import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { apiClient, AuthenticationError } from "@/lib/api-client";

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
  fetchSkills: () => Promise<void>;
  fetchInterests: () => Promise<void>;
  addSkill: (skillId: number, proficiencyLevel: string) => Promise<void>;
  removeSkill: (skillId: number) => Promise<void>;
  addInterest: (interestId: number) => Promise<void>;
  removeInterest: (interestId: number) => Promise<void>;
};

export function useVolunteerSkillsInterests(): UseVolunteerSkillsInterestsResult {
  const router = useRouter();
  const [skills, setSkills] = useState<CatalogSkill[]>([]);
  const [interests, setInterests] = useState<CatalogInterest[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isLoadingInterests, setIsLoadingInterests] = useState(false);

  const handleAuthError = useCallback(
    (err: unknown): void => {
      if (err instanceof AuthenticationError) {
        router.push("/auth/login");
      } else {
        throw err;
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
      handleAuthError(error);
    } finally {
      setIsLoadingSkills(false);
    }
  }, [handleAuthError]);

  const fetchInterests = useCallback(async (): Promise<void> => {
    setIsLoadingInterests(true);
    try {
      const json = await apiClient.get<{ data: CatalogInterest[] }>(
        "/api/staff/interests",
      );
      setInterests(json.data);
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoadingInterests(false);
    }
  }, [handleAuthError]);

  const addSkill = useCallback(
    async (skillId: number, proficiencyLevel: string): Promise<void> => {
      try {
        await apiClient.post("/api/volunteer/profile/skills", {
          skillId,
          proficiencyLevel,
        });
      } catch (error) {
        handleAuthError(error);
      }
    },
    [handleAuthError],
  );

  const removeSkill = useCallback(
    async (skillId: number): Promise<void> => {
      try {
        await apiClient.delete("/api/volunteer/profile/skills", {
          skillId,
        });
      } catch (error) {
        handleAuthError(error);
      }
    },
    [handleAuthError],
  );

  const addInterest = useCallback(
    async (interestId: number): Promise<void> => {
      try {
        await apiClient.post("/api/volunteer/profile/interests", {
          interestId,
        });
      } catch (error) {
        handleAuthError(error);
      }
    },
    [handleAuthError],
  );

  const removeInterest = useCallback(
    async (interestId: number): Promise<void> => {
      try {
        await apiClient.delete("/api/volunteer/profile/interests", {
          interestId,
        });
      } catch (error) {
        handleAuthError(error);
      }
    },
    [handleAuthError],
  );

  return {
    skills,
    interests,
    isLoadingSkills,
    isLoadingInterests,
    fetchSkills,
    fetchInterests,
    addSkill,
    removeSkill,
    addInterest,
    removeInterest,
  };
}
