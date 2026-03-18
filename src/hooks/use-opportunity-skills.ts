import { useCallback, useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

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
  loading: boolean;
  isMutating: boolean;
  addSkill: (skillId: number) => Promise<boolean>;
  removeSkill: (skillId: number) => Promise<boolean>;
  addInterest: (interestId: number) => Promise<boolean>;
  removeInterest: (interestId: number) => Promise<boolean>;
  applyToEvents: (
    eventIds: number[],
    skillIds: number[],
    interestIds: number[],
  ) => Promise<void>;
  refetch: () => Promise<{
    requiredSkills: EventSkill[];
    requiredInterests: EventInterest[];
  }>;
  error: string | null;
};

export function useOpportunitySkills(
  eventId: number | null,
): UseOpportunitySkillsResult {
  const [requiredSkills, setRequiredSkills] = useState<EventSkill[]>([]);
  const [requiredInterests, setRequiredInterests] = useState<EventInterest[]>(
    [],
  );
  const [loading, setLoading] = useState(eventId !== null);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiError = useApiErrorHandler(setError);

  const fetchAll = useCallback(async (): Promise<{
    requiredSkills: EventSkill[];
    requiredInterests: EventInterest[];
  }> => {
    if (eventId === null) {
      return { requiredSkills: [], requiredInterests: [] };
    }
    setLoading(true);
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
    } catch (error_) {
      handleApiError(error_, "Failed to load opportunity requirements.");
      return { requiredSkills: [], requiredInterests: [] };
    } finally {
      setLoading(false);
    }
  }, [eventId, handleApiError]);

  useEffect(() => {
    if (eventId === null) {
      setRequiredSkills([]);
      setRequiredInterests([]);
      setLoading(false);
      return;
    }
    fetchAll().catch((error: unknown) => {
      console.error("Failed to load opportunity requirements:", error);
    });
  }, [eventId, fetchAll]);

  const addSkill = useCallback(
    async (skillId: number): Promise<boolean> => {
      if (eventId === null) return false;
      setIsMutating(true);
      try {
        await apiClient.post(`/api/staff/calendar/events/${eventId}/skills`, {
          skillId,
        });
        return true;
      } catch (error_) {
        if (handleApiError(error_)) return false;
        setError(
          error_ instanceof Error ? error_.message : "Failed to add skill.",
        );
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [eventId, handleApiError],
  );

  const removeSkill = useCallback(
    async (skillId: number): Promise<boolean> => {
      if (eventId === null) return false;
      setIsMutating(true);
      try {
        await apiClient.delete(`/api/staff/calendar/events/${eventId}/skills`, {
          skillId,
        });
        return true;
      } catch (error_) {
        if (handleApiError(error_)) return false;
        setError(
          error_ instanceof Error ? error_.message : "Failed to remove skill.",
        );
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [eventId, handleApiError],
  );

  const addInterest = useCallback(
    async (interestId: number): Promise<boolean> => {
      if (eventId === null) return false;
      setIsMutating(true);
      try {
        await apiClient.post(
          `/api/staff/calendar/events/${eventId}/interests`,
          { interestId },
        );
        return true;
      } catch (error_) {
        if (handleApiError(error_)) return false;
        setError(
          error_ instanceof Error ? error_.message : "Failed to add interest.",
        );
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [eventId, handleApiError],
  );

  const removeInterest = useCallback(
    async (interestId: number): Promise<boolean> => {
      if (eventId === null) return false;
      setIsMutating(true);
      try {
        await apiClient.delete(
          `/api/staff/calendar/events/${eventId}/interests`,
          { interestId },
        );
        return true;
      } catch (error_) {
        if (handleApiError(error_)) return false;
        setError(
          error_ instanceof Error
            ? error_.message
            : "Failed to remove interest.",
        );
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [eventId, handleApiError],
  );

  const applyToEvents = useCallback(
    async (
      eventIds: number[],
      skillIds: number[],
      interestIds: number[],
    ): Promise<void> => {
      setIsMutating(true);
      try {
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
            const error_ = result.reason;
            if (handleApiError(error_)) {
              // Already handled auth error
            } else if (firstNonAuthError === null) {
              firstNonAuthError = error_;
            }
          }
        }

        if (firstNonAuthError !== null) {
          throw firstNonAuthError;
        }
      } finally {
        setIsMutating(false);
      }
    },
    [handleApiError],
  );

  return {
    requiredSkills,
    requiredInterests,
    loading,
    isMutating,
    error,
    addSkill,
    removeSkill,
    addInterest,
    removeInterest,
    applyToEvents,
    refetch: fetchAll,
  };
}
