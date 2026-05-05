"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useSnackbar } from "notistack";
import { type JSX, useCallback, useEffect, useState } from "react";

import { MobileDialog, ModalTitleBar } from "@/components/shared";
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

  const selectedDoc = documents.find((d) => d.id === selectedDocId) ?? null;
  const selectedResponse =
    selectedDocId === null ? undefined : responseMap.get(selectedDocId);

  return (
    <>
      <Card
        elevation={0}
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && (
          <Typography variant="body2" color="error" sx={{ p: 3 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && documents.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
            No onboarding documents have been added yet.
          </Typography>
        )}

        {!loading && !error && documents.length > 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#fafafa" }}>
                  <TableCell
                    sx={{ pl: 3, fontWeight: 600, fontSize: "0.875rem" }}
                  >
                    Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Category
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Completed
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((doc) => {
                  const response = responseMap.get(doc.id);
                  const hasResponded = response !== undefined;

                  return (
                    <TableRow
                      key={doc.id}
                      hover
                      onClick={() => setSelectedDocId(doc.id)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell sx={{ pl: 3 }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <TypeBadge type={doc.type} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={500} noWrap>
                              {doc.title}
                            </Typography>
                            {doc.description && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block" }}
                                noWrap
                              >
                                {doc.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {typeLabel(doc.type)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {doc.actionType === "informational" ? (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        ) : hasResponded ? (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Completed"
                            size="small"
                            color="success"
                          />
                        ) : (
                          <Chip
                            label="Pending"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {response?.signedAt
                            ? new Date(response.signedAt).toLocaleDateString()
                            : "—"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

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
// TypeBadge + typeLabel
// ---------------------------------------------------------------------------

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    pdf: "PDF",
    video: "Video",
    link: "Link",
  };
  return labels[type] ?? "Document";
}

function TypeBadge({ type }: { type: string }): JSX.Element {
  const map: Record<string, { label: string; bgcolor: string }> = {
    pdf: { label: "PDF", bgcolor: "error.main" },
    video: { label: "VID", bgcolor: "primary.main" },
    link: { label: "LNK", bgcolor: "success.main" },
  };
  const { label, bgcolor } = map[type] ?? { label: "DOC", bgcolor: "grey.500" };

  return (
    <Box
      sx={{
        width: 32,
        height: 40,
        borderRadius: 1,
        bgcolor,
        color: "#fff",
        fontSize: 10,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {label}
    </Box>
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
    <MobileDialog open={doc !== null} onClose={onClose} maxWidth="xl" fullWidth>
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
              <Box sx={{ height: { xs: "60vh", sm: "80vh" }, width: "100%" }}>
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
                  height: { xs: "55vh", sm: "80vh" },
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

          <DialogActions
            sx={{
              flexWrap: "wrap",
              position: { xs: "sticky", sm: "static" },
              bottom: 0,
              bgcolor: "background.paper",
              borderTop: { xs: 1, sm: 0 },
              borderColor: "divider",
            }}
          >
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
    </MobileDialog>
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
