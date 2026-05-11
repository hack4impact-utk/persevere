"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CreateIcon from "@mui/icons-material/Create";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Fab,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { type ReactElement, useCallback, useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/ui";
import { useCommunications } from "@/hooks/use-communications";
import { useIsMobile } from "@/hooks/use-is-mobile";

import ComposeModal from "./compose-modal";

export type CommunicationsListProps = {
  userRole: "staff" | "admin";
};

/**
 * CommunicationsList
 *
 * Two-panel layout for viewing and managing bulk communications.
 * Left panel: list of communications. Right panel: selected communication details.
 */
export default function CommunicationsList({
  userRole,
}: CommunicationsListProps): ReactElement {
  const isMobile = useIsMobile();
  const {
    communications,
    selectedCommunication,
    loading,
    isMutating,
    error,
    search,
    setSearch,
    loadCommunications,
    selectCommunication,
    deleteCommunication,
    clearSelection,
  } = useCommunications();
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    id: number | null;
    subject: string;
  }>({ open: false, id: null, subject: "" });

  const formatDate = useCallback((date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }, []);

  const getRecipientLabel = useCallback((recipientType: string): string => {
    switch (recipientType) {
      case "volunteers": {
        return "To: Volunteers";
      }
      case "staff": {
        return "To: Staff";
      }
      case "both": {
        return "To: Staff & Volunteers";
      }
      default: {
        return `To: ${recipientType}`;
      }
    }
  }, []);

  const truncateText = useCallback(
    (text: string, maxLength: number): string => {
      // Strip HTML tags for preview
      const plainText = text.replaceAll(/<[^>]*>/g, "").trim();
      if (plainText.length <= maxLength) return plainText;
      return `${plainText.slice(0, Math.max(0, maxLength)).trim()}...`;
    },
    [],
  );

  const handleDeleteConfirm = useCallback(async (): Promise<void> => {
    if (!confirmDelete.id) return;
    setConfirmDelete({ open: false, id: null, subject: "" });
    await deleteCommunication(confirmDelete.id);
  }, [confirmDelete.id, deleteCommunication]);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      {/* Main content area */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Left Panel - Communications List */}
        <Paper
          variant="outlined"
          sx={{
            width: { xs: "100%", md: "380px" },
            flexShrink: 0,
            display: isMobile && selectedCommunication ? "none" : "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 2,
            borderColor: "divider",
          }}
        >
          {/* Search input */}
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}>
            <TextField
              size="small"
              placeholder="Search communications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        fontSize="small"
                        sx={{ color: "text.secondary" }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          {loading && communications.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          ) : communications.length === 0 ? (
            <EmptyState
              message={
                search
                  ? "No communications match your search."
                  : "No communications yet. Send your first message."
              }
            />
          ) : (
            <List
              sx={{
                overflowY: "auto",
                overflowX: "hidden",
                flex: 1,
                p: 0,
                minHeight: 0,
              }}
            >
              {communications.map((comm) => (
                <ListItem
                  key={comm.id}
                  disablePadding
                  sx={{
                    borderLeft:
                      selectedCommunication?.id === comm.id
                        ? "4px solid"
                        : "4px solid transparent",
                    borderLeftColor:
                      selectedCommunication?.id === comm.id
                        ? "primary.main"
                        : "transparent",
                  }}
                >
                  <ListItemButton
                    onClick={() => void selectCommunication(comm.id)}
                    selected={selectedCommunication?.id === comm.id}
                    sx={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      py: 1.75,
                      pl: 2,
                      pr: 5,
                      position: "relative",
                      "&.Mui-selected": {
                        bgcolor: "rgba(50,123,247,.06)",
                        "&:hover": { bgcolor: "rgba(50,123,247,.09)" },
                      },
                      "&:hover": { bgcolor: "rgba(0,0,0,.02)" },
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 0.25 }}
                    >
                      {formatDate(comm.sentAt)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {getRecipientLabel(comm.recipientType)}
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      sx={{ mb: 0.5 }}
                    >
                      {comm.subject}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {truncateText(comm.body, 100)}
                    </Typography>
                    <IconButton
                      size="small"
                      disabled={isMutating}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete({
                          open: true,
                          id: comm.id,
                          subject: comm.subject,
                        });
                      }}
                      sx={{
                        position: "absolute",
                        top: 10,
                        right: 8,
                        color: "text.disabled",
                        "&:hover": { color: "text.secondary" },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        {/* Right Panel - Communication Details */}
        <Paper
          variant="outlined"
          sx={{
            flex: 1,
            display: isMobile && !selectedCommunication ? "none" : "flex",
            flexDirection: "column",
            overflow: "hidden",
            p: { xs: 2, md: 4 },
            borderRadius: 2,
            borderColor: "divider",
          }}
        >
          {selectedCommunication ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              {/* Back button (mobile only) */}
              {isMobile && (
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={clearSelection}
                  sx={{ mb: 1, alignSelf: "flex-start" }}
                >
                  Back
                </Button>
              )}

              {/* Subject */}
              <Typography
                sx={{
                  fontSize: 32,
                  fontWeight: 400,
                  color: "text.primary",
                  mb: 3,
                  flexShrink: 0,
                }}
              >
                {selectedCommunication.subject}
              </Typography>

              {/* Sender and Recipient Info */}
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ mb: 2, flexShrink: 0 }}
              >
                <Avatar
                  sx={{
                    bgcolor: "rgba(0,0,0,.12)",
                    color: "rgba(0,0,0,.54)",
                    width: 40,
                    height: 40,
                  }}
                >
                  <PersonIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {selectedCommunication.sender
                      ? `${selectedCommunication.sender.firstName} ${selectedCommunication.sender.lastName}`
                      : "Unknown Sender"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getRecipientLabel(selectedCommunication.recipientType)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(selectedCommunication.sentAt)}
                </Typography>
              </Stack>

              <Divider sx={{ my: 2, flexShrink: 0 }} />

              {/* Body Content - Render HTML from rich text editor */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  overflowX: "hidden",
                  minHeight: 0,
                  "& p": { margin: "0 0 8px 0" },
                  "& h1": {
                    fontSize: "1.75rem",
                    fontWeight: 600,
                    margin: "16px 0 8px",
                  },
                  "& h2": {
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    margin: "14px 0 6px",
                  },
                  "& h3": {
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    margin: "12px 0 4px",
                  },
                  "& ul, & ol": { paddingLeft: "24px", margin: "8px 0" },
                  "& li": { marginBottom: "4px" },
                  "& a": { color: "#1976d2", textDecoration: "underline" },
                }}
                dangerouslySetInnerHTML={{ __html: selectedCommunication.body }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Typography color="text.secondary">
                Select a communication to view details
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Compose FAB */}
      <Fab
        color="primary"
        aria-label="compose"
        onClick={() => setComposeModalOpen(true)}
        sx={{ position: "fixed", bottom: 32, right: 32 }}
      >
        <CreateIcon />
      </Fab>

      {/* Compose Modal */}
      <ComposeModal
        open={composeModalOpen}
        onClose={() => setComposeModalOpen(false)}
        onCreated={() => {
          void loadCommunications({ search: search || undefined });
        }}
        userRole={userRole}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDelete.open}
        title="Delete Communication"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong>&ldquo;{confirmDelete.subject}&rdquo;</strong>? This action
            cannot be undone.
          </>
        }
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={() => void handleDeleteConfirm()}
        onClose={() => setConfirmDelete({ open: false, id: null, subject: "" })}
      />
    </Box>
  );
}
