"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LinkIcon from "@mui/icons-material/Link";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useSnackbar } from "notistack";
import { type JSX, useCallback, useEffect, useState } from "react";

import { ModalTitleBar } from "@/components/shared";
import OnboardingModuleCard from "@/components/shared/onboarding-module-card";
import { useOnboardingDocuments } from "@/hooks/use-onboarding-documents";

type DocumentViewerProps = {
  onDocumentSigned?: () => Promise<void>;
};

export default function DocumentViewer({
  onDocumentSigned,
}: DocumentViewerProps): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const {
    documents,
    signatures,
    loading,
    error,
    fetchSignatures,
    signDocument,
  } = useOnboardingDocuments("/api/volunteer/onboarding/documents");

  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);

  useEffect(() => {
    void fetchSignatures();
  }, [fetchSignatures]);

  // Map from documentId → { consentGiven, signedAt }
  const responseMap = new Map(
    signatures.map((s) => [
      s.documentId,
      { consentGiven: s.consentGiven, signedAt: s.signedAt },
    ]),
  );

  const handleRespond = useCallback(
    async (documentId: number, consentGiven?: boolean): Promise<void> => {
      try {
        await signDocument(documentId, consentGiven);
        try {
          await onDocumentSigned?.();
        } catch (error_) {
          console.error("Failed to refresh onboarding status:", error_);
        }
        enqueueSnackbar("Response recorded successfully", {
          variant: "success",
        });
      } catch {
        enqueueSnackbar("Failed to record response", { variant: "error" });
      }
    },
    [signDocument, onDocumentSigned, enqueueSnackbar],
  );

  if (loading) {
    return (
      <Grid size={{ xs: 12 }}>
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      </Grid>
    );
  }

  if (error) {
    return (
      <Grid size={{ xs: 12 }}>
        {/* Using Typography with error color instead of Alert, since Alert was removed from imports */}
        <Typography color="error">{error}</Typography>
      </Grid>
    );
  }

  if (documents.length === 0) {
    return (
      <Grid size={{ xs: 12 }}>
        <Typography variant="body2" color="text.secondary">
          No onboarding documents have been added yet.
        </Typography>
      </Grid>
    );
  }

  const selectedDoc = documents.find((d) => d.id === selectedDocId) ?? null;
  const selectedResponse =
    selectedDocId === null ? undefined : responseMap.get(selectedDocId);

  return (
    <>
      {documents.map((doc) => {
        const response = responseMap.get(doc.id);
        const hasResponded = response !== undefined;

        return (
          <Grid key={doc.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <DocumentCard
              doc={doc}
              hasResponded={hasResponded}
              onClick={() => setSelectedDocId(doc.id)}
            />
          </Grid>
        );
      })}

      <DocumentModal
        doc={selectedDoc}
        response={selectedResponse}
        onClose={() => setSelectedDocId(null)}
        onRespond={handleRespond}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// DocumentCard
// ---------------------------------------------------------------------------

type DocCardDoc = {
  id: number;
  title: string;
  type: string;
  actionType: string;
  description: string | null;
  required: boolean;
};

function DocumentCard({
  doc,
  hasResponded,
  onClick,
}: {
  doc: DocCardDoc;
  hasResponded: boolean;
  onClick: () => void;
}): JSX.Element {
  const Icon =
    doc.type === "pdf"
      ? PictureAsPdfIcon
      : doc.type === "video"
        ? OndemandVideoIcon
        : LinkIcon;

  return (
    <OnboardingModuleCard
      title={doc.title}
      description={doc.description || undefined}
      icon={<Icon />}
      isCompleted={
        doc.actionType === "informational" ? undefined : hasResponded
      }
      onClick={onClick}
      statusNode={
        <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
          {doc.required && (
            <Chip
              label="Required"
              size="small"
              color="error"
              variant="outlined"
            />
          )}
          {doc.actionType !== "informational" &&
            (hasResponded ? (
              <Chip
                icon={<CheckCircleIcon />}
                label="Completed"
                size="small"
                color="success"
              />
            ) : (
              <Chip label="Pending" size="small" variant="outlined" />
            ))}
        </Box>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// DocumentModal
// ---------------------------------------------------------------------------

type DocModalDoc = {
  id: number;
  title: string;
  type: string;
  actionType: string;
  url: string;
  required: boolean;
};

type ModalResponse = {
  consentGiven: boolean | null | undefined;
  signedAt: Date;
};

function DocumentModal({
  doc,
  response,
  onClose,
  onRespond,
}: {
  doc: DocModalDoc | null;
  response: ModalResponse | undefined;
  onClose: () => void;
  onRespond: (documentId: number, consentGiven?: boolean) => Promise<void>;
}): JSX.Element {
  const hasResponded = response !== undefined;

  return (
    <Dialog open={doc !== null} onClose={onClose} maxWidth="xl" fullWidth>
      {doc && (
        <>
          <ModalTitleBar
            title={
              <Box display="flex" alignItems="center" gap={1}>
                {doc.title}
                {doc.required && (
                  <Chip
                    label="Required"
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                )}
              </Box>
            }
            onClose={onClose}
          />

          <DialogContent
            dividers
            sx={
              doc.type === "link"
                ? {}
                : { p: 0, bgcolor: doc.type === "video" ? "black" : "grey.100" }
            }
          >
            {doc.type === "pdf" && (
              <Box sx={{ height: "80vh", width: "100%" }}>
                <iframe
                  src={doc.url}
                  title={doc.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    display: "block",
                  }}
                />
              </Box>
            )}

            {doc.type === "video" && (
              <Box
                sx={{
                  height: "80vh",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <video
                  src={doc.url}
                  controls
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    display: "block",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  }}
                />
              </Box>
            )}

            {doc.type === "link" && (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={1.5}
                py={4}
              >
                <Typography variant="body2" color="text.secondary">
                  This document opens in a new tab.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<OpenInNewIcon />}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  component="a"
                >
                  Open Link
                </Button>
              </Box>
            )}
          </DialogContent>

          <DialogActions>
            {doc.type !== "link" && (
              <Button
                variant="outlined"
                size="small"
                endIcon={<OpenInNewIcon />}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                component="a"
              >
                Open in new tab
              </Button>
            )}
            {doc.actionType === "informational" ? (
              <>
                <Box flex={1} />
                <Button onClick={onClose}>Close</Button>
              </>
            ) : hasResponded && response ? (
              <>
                <ResponseStatus
                  actionType={doc.actionType}
                  consentGiven={response.consentGiven}
                  signedAt={response.signedAt}
                />
                <Box flex={1} />
                <Button onClick={onClose}>Close</Button>
              </>
            ) : (
              <>
                <Box flex={1} />
                <Button onClick={onClose}>Cancel</Button>
                <ActionButtons
                  doc={doc}
                  hasResponded={false}
                  onRespond={onRespond}
                />
              </>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// ResponseStatus
// ---------------------------------------------------------------------------

function ResponseStatus({
  actionType,
  consentGiven,
  signedAt,
}: {
  actionType: string;
  consentGiven: boolean | null | undefined;
  signedAt: Date;
}): JSX.Element {
  const dateStr = new Date(signedAt).toLocaleDateString();

  if (actionType === "consent") {
    if (consentGiven) {
      return (
        <Box display="flex" alignItems="center" gap={0.5}>
          <CheckCircleIcon color="success" sx={{ fontSize: 14 }} />
          <Typography variant="caption" color="success.main">
            Consent given {dateStr}
          </Typography>
        </Box>
      );
    }
    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        <InfoOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
        <Typography variant="caption" color="text.secondary">
          Declined {dateStr}
        </Typography>
      </Box>
    );
  }

  const label = actionType === "acknowledge" ? "Acknowledged" : "Signed";
  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      <CheckCircleIcon color="success" sx={{ fontSize: 14 }} />
      <Typography variant="caption" color="success.main">
        {label} {dateStr}
      </Typography>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// ActionButtons
// ---------------------------------------------------------------------------

function ActionButtons({
  doc,
  hasResponded,
  onRespond,
}: {
  doc: { id: number; actionType: string };
  hasResponded: boolean;
  onRespond: (documentId: number, consentGiven?: boolean) => Promise<void>;
}): JSX.Element | null {
  const [isSigning, setIsSigning] = useState(false);

  if (hasResponded || doc.actionType === "informational") return null;

  const handleClick = async (consentGiven?: boolean): Promise<void> => {
    setIsSigning(true);
    try {
      await onRespond(doc.id, consentGiven);
    } finally {
      setIsSigning(false);
    }
  };

  if (doc.actionType === "consent") {
    return (
      <>
        <Button
          variant="outlined"
          size="small"
          disabled={isSigning}
          onClick={() => void handleClick(false)}
        >
          I do not consent
        </Button>
        <Button
          variant="contained"
          size="small"
          disabled={isSigning}
          onClick={() => void handleClick(true)}
        >
          I have read and I consent
        </Button>
      </>
    );
  }

  if (doc.actionType === "acknowledge") {
    return (
      <Button
        variant="contained"
        size="small"
        disabled={isSigning}
        onClick={() => void handleClick()}
      >
        I have read and acknowledge this
      </Button>
    );
  }

  return (
    <Button
      variant="contained"
      size="small"
      disabled={isSigning}
      onClick={() => void handleClick()}
    >
      I have read and agree to this document
    </Button>
  );
}
