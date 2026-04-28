"use client";

import Box from "@mui/material/Box";
import { type JSX, useCallback } from "react";

import { PageHeader } from "@/components/shared";
import DocumentViewer from "@/components/volunteer/onboarding/document-viewer";
import OnboardingChecklist from "@/components/volunteer/onboarding/onboarding-checklist";
import { useOnboarding } from "@/hooks/use-onboarding";

export default function OnboardingPage(): JSX.Element {
  const { status, isLoading, error, refetch } = useOnboarding();

  const handleDocumentSigned = useCallback(async (): Promise<void> => {
    await refetch();
  }, [refetch]);

  return (
    <Box
      sx={{
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: 4,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <PageHeader
        eyebrow="Volunteer Portal"
        title="Onboarding"
        subtitle="Complete your required documents and get ready to volunteer."
      />
      <DocumentViewer onDocumentSigned={handleDocumentSigned} />

      {/* Floating progress widget — position: fixed, out of layout flow */}
      <OnboardingChecklist
        status={status}
        isLoading={isLoading}
        error={error}
      />
    </Box>
  );
}
