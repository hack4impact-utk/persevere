import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { apiClient, AuthenticationError } from "@/lib/api-client";

export type EventSkill = {
  skillId: number;
  skillName: string | null;
};

export type EventInterest = {
  interestId: number;
  interestName: string | null;
};

export type UseOpportunitySkillsResult = {
  requiredSkills: EventSkill[];
  requiredInterests: EventInterest[];
  isLoading: boolean;
  addSkill: (skillId: number) => Promise<void>;
  removeSkill: (skillId: number) => Promise<void>;
  addInterest: (interestId: number) => Promise<void>;
  removeInterest: (interestId: number) => Promise<void>;
  applyToEvents: (
    eventIds: number[],
    skillIds: number[],
    interestIds: number[],
  ) => Promise<void>;
  refetch: () => Promise<{
    requiredSkills: EventSkill[];
    requiredInterests: EventInterest[];
  }>;
};

export function useOpportunitySkills(
  eventId: number | null,
): UseOpportunitySkillsResult {
  const router = useRouter();
  const [requiredSkills, setRequiredSkills] = useState<EventSkill[]>([]);
  const [requiredInterests, setRequiredInterests] = useState<EventInterest[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(eventId !== null);

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

  const fetchAll = useCallback(async (): Promise<{
    requiredSkills: EventSkill[];
    requiredInterests: EventInterest[];
  }> => {
    if (eventId === null) {
      return { requiredSkills: [], requiredInterests: [] };
    }
    setIsLoading(true);
    try {
      const [skillsResult, interestsResult] = await Promise.all([
        apiClient.get<{ data: EventSkill[] }>(
          `/api/staff/calendar/events/${eventId}/skills`,
        ),
        apiClient.get<{ data: EventInterest[] }>(
          `/api/staff/calendar/events/${eventId}/interests`,
        ),
      ]);
      setRequiredSkills(skillsResult.data);
      setRequiredInterests(interestsResult.data);
      return {
        requiredSkills: skillsResult.data,
        requiredInterests: interestsResult.data,
      };
    } catch (error) {
      handleAuthError(error);
      return { requiredSkills: [], requiredInterests: [] };
    } finally {
      setIsLoading(false);
    }
  }, [eventId, handleAuthError]);

  useEffect(() => {
    if (eventId === null) {
      setRequiredSkills([]);
      setRequiredInterests([]);
      setIsLoading(false);
      return;
    }
    fetchAll().catch((error: unknown) => {
      console.error("Failed to load opportunity requirements:", error);
    });
  }, [eventId, fetchAll]);

  const addSkill = useCallback(
    async (skillId: number): Promise<void> => {
      if (eventId === null) return;
      try {
        await apiClient.post(`/api/staff/calendar/events/${eventId}/skills`, {
          skillId,
        });
      } catch (error) {
        handleAuthError(error);
      }
    },
    [eventId, handleAuthError],
  );

  const removeSkill = useCallback(
    async (skillId: number): Promise<void> => {
      if (eventId === null) return;
      try {
        await apiClient.delete(`/api/staff/calendar/events/${eventId}/skills`, {
          skillId,
        });
      } catch (error) {
        handleAuthError(error);
      }
    },
    [eventId, handleAuthError],
  );

  const addInterest = useCallback(
    async (interestId: number): Promise<void> => {
      if (eventId === null) return;
      try {
        await apiClient.post(
          `/api/staff/calendar/events/${eventId}/interests`,
          { interestId },
        );
      } catch (error) {
        handleAuthError(error);
      }
    },
    [eventId, handleAuthError],
  );

  const removeInterest = useCallback(
    async (interestId: number): Promise<void> => {
      if (eventId === null) return;
      try {
        await apiClient.delete(
          `/api/staff/calendar/events/${eventId}/interests`,
          { interestId },
        );
      } catch (error) {
        handleAuthError(error);
      }
    },
    [eventId, handleAuthError],
  );

  const applyToEvents = useCallback(
    async (
      eventIds: number[],
      skillIds: number[],
      interestIds: number[],
    ): Promise<void> => {
      const skillPromises = eventIds.flatMap((eid) =>
        skillIds.map((sid) =>
          apiClient.post(`/api/staff/calendar/events/${eid}/skills`, {
            skillId: sid,
          }),
        ),
      );
      const interestPromises = eventIds.flatMap((eid) =>
        interestIds.map((iid) =>
          apiClient.post(`/api/staff/calendar/events/${eid}/interests`, {
            interestId: iid,
          }),
        ),
      );
      const results = await Promise.allSettled([
        ...skillPromises,
        ...interestPromises,
      ]);

      let firstNonAuthError: unknown | null = null;

      for (const result of results) {
        if (result.status === "rejected") {
          const error = result.reason;
          if (error instanceof AuthenticationError) {
            handleAuthError(error);
          } else if (firstNonAuthError === null) {
            firstNonAuthError = error;
          }
        }
      }

      if (firstNonAuthError !== null) {
        throw firstNonAuthError;
      }
    },
    [handleAuthError],
  );

  return {
    requiredSkills,
    requiredInterests,
    isLoading,
    addSkill,
    removeSkill,
    addInterest,
    removeInterest,
    applyToEvents,
    refetch: fetchAll,
  };
}
