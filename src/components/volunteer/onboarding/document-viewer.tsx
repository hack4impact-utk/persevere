"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useSnackbar } from "notistack";
import { type JSX, useCallback, useEffect } from "react";

import { useOnboardingDocuments } from "@/hooks/use-onboarding-documents";

export default function DocumentViewer(): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const {
    documents,
    signatures,
    loading,
    error,
    fetchSignatures,
    signDocument,
  } = useOnboardingDocuments("/api/volunteer/onboarding/documents");

  useEffect(() => {
    void fetchSignatures();
  }, [fetchSignatures]);

  const signedIds = new Set(signatures.map((s) => s.documentId));
  const signedAt = new Map(signatures.map((s) => [s.documentId, s.signedAt]));

  const handleSign = useCallback(
    async (documentId: number): Promise<void> => {
      try {
        await signDocument(documentId);
        enqueueSnackbar("Document signed successfully", { variant: "success" });
      } catch {
        enqueueSnackbar("Failed to sign document", { variant: "error" });
      }
    },
    [signDocument, enqueueSnackbar],
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (documents.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No onboarding documents have been added yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={2} divider={<Divider />}>
      {documents.map((doc) => {
        const isSigned = signedIds.has(doc.id);
        const ts = signedAt.get(doc.id);

        return (
          <Box key={doc.id}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
              gap={2}
            >
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Typography variant="body1" fontWeight={500}>
                    {doc.title}
                  </Typography>
                  {doc.required && (
                    <Typography
                      variant="caption"
                      sx={{
                        bgcolor: "error.light",
                        color: "error.contrastText",
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 0.5,
                        fontWeight: 600,
                        fontSize: "0.65rem",
                      }}
                    >
                      Required
                    </Typography>
                  )}
                </Box>
                {doc.description && (
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    {doc.description}
                  </Typography>
                )}
                {isSigned && ts && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 14 }} />
                    <Typography variant="caption" color="success.main">
                      Signed {new Date(ts).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <ViewButton doc={doc} />
                {!isSigned && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => void handleSign(doc.id)}
                  >
                    Sign
                  </Button>
                )}
              </Stack>
            </Box>

            {/* Inline preview for PDFs */}
            {doc.type === "pdf" && (
              <Box
                mt={1.5}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                <iframe
                  src={doc.url}
                  title={doc.title}
                  style={{ width: "100%", height: 480, border: "none" }}
                />
              </Box>
            )}

            {/* Inline preview for videos */}
            {doc.type === "video" && (
              <Box mt={1.5}>
                <video
                  src={doc.url}
                  controls
                  style={{ width: "100%", maxHeight: 360, borderRadius: 4 }}
                />
              </Box>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}

function ViewButton({
  doc,
}: {
  doc: { type: string; url: string; title: string };
}): JSX.Element {
  if (doc.type === "link") {
    return (
      <Button
        variant="outlined"
        size="small"
        endIcon={<OpenInNewIcon />}
        href={doc.url}
        target="_blank"
        rel="noopener noreferrer"
        component="a"
      >
        Open
      </Button>
    );
  }

  // PDF and video have inline previews — just show a direct link as secondary action
  return (
    <Button
      variant="outlined"
      size="small"
      endIcon={<OpenInNewIcon />}
      href={doc.url}
      target="_blank"
      rel="noopener noreferrer"
      component="a"
    >
      Open
    </Button>
  );
}
