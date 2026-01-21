"use client";

import CreateIcon from "@mui/icons-material/Create";
import PersonIcon from "@mui/icons-material/Person";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import {
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AuthenticationError,
  fetchCommunicationById,
  fetchCommunications,
} from "./communication-service";
import ComposeModal from "./compose-modal";
import type { BulkCommunicationLog } from "./types";

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
  const router = useRouter();
  const [communications, setCommunications] = useState<BulkCommunicationLog[]>(
    [],
  );
  const [selectedCommunication, setSelectedCommunication] =
    useState<BulkCommunicationLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composeModalOpen, setComposeModalOpen] = useState(false);

  const loadCommunicationsRef = useRef<(() => Promise<void>) | undefined>(
    undefined,
  );

  const loadCommunications = useCallback(async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetchCommunications({
        page: 1,
        limit: 50,
      });

      setCommunications(response.communications || []);

      // Auto-select first communication if none selected
      if (
        response.communications.length > 0 &&
        !selectedCommunication &&
        !loadCommunicationsRef.current
      ) {
        setSelectedCommunication(response.communications[0]);
      }
    } catch (error) {
      if (error instanceof AuthenticationError) {
        router.push("/auth/login");
        return;
      }

      console.error("Failed to fetch communications:", error);
      setError("Failed to load communications. Please try again later.");
      setCommunications([]);
    } finally {
      setLoading(false);
    }
  }, [router, selectedCommunication]);

  loadCommunicationsRef.current = loadCommunications;

  useEffect(() => {
    void loadCommunications();
  }, [loadCommunications]);

  const handleCommunicationClick = useCallback(async (id: number) => {
    try {
      const communication = await fetchCommunicationById(id);
      setSelectedCommunication(communication);
    } catch (error) {
      console.error("Failed to fetch communication:", error);
      setError("Failed to load communication details.");
    }
  }, []);

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
      if (text.length <= maxLength) return text;
      return `${text.slice(0, Math.max(0, maxLength)).trim()}...`;
    },
    [],
  );

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
      {/* Header with Compose button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mb: 2,
          flexShrink: 0,
        }}
      >
        <Button
          variant="contained"
          startIcon={<CreateIcon />}
          onClick={() => setComposeModalOpen(true)}
        >
          Compose
        </Button>
      </Box>

      {/* Main content area */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flex: 1,
          minHeight: 0,
          height: 0, // Force flex child to respect height constraints
          overflow: "hidden",
        }}
      >
        {/* Left Panel - Communications List */}
        <Paper
          sx={{
            width: "400px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            height: "100%",
            minHeight: 0,
          }}
        >
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
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                p: 2,
              }}
            >
              <Typography color="text.secondary">
                No communications yet. Click Compose to send your first message.
              </Typography>
            </Box>
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
                    borderRight:
                      selectedCommunication?.id === comm.id
                        ? "4px solid #1976d2"
                        : "4px solid transparent",
                  }}
                >
                  <ListItemButton
                    onClick={() => handleCommunicationClick(comm.id)}
                    selected={selectedCommunication?.id === comm.id}
                    sx={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      py: 2,
                      px: 2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {formatDate(comm.sentAt)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {getRecipientLabel(comm.recipientType)}
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      sx={{ mb: 1 }}
                    >
                      {comm.subject}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {truncateText(comm.body, 120)}
                    </Typography>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        {/* Right Panel - Communication Details */}
        <Paper
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            p: 3,
            height: "100%",
            minHeight: 0,
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
              {/* Subject */}
              <Typography variant="h4" gutterBottom sx={{ flexShrink: 0 }}>
                {selectedCommunication.subject}
              </Typography>

              <Divider sx={{ my: 2, flexShrink: 0 }} />

              {/* Sender and Recipient Info */}
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ mb: 2, flexShrink: 0 }}
              >
                <Avatar>
                  <PersonIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" fontWeight="medium">
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

              {/* Body Content */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  overflowX: "hidden",
                  whiteSpace: "pre-wrap",
                  minHeight: 0,
                }}
              >
                <Typography variant="body1">
                  {selectedCommunication.body}
                </Typography>
              </Box>
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

      {/* Compose Modal */}
      <ComposeModal
        open={composeModalOpen}
        onClose={() => setComposeModalOpen(false)}
        onCreated={() => {
          void loadCommunications();
        }}
        userRole={userRole}
      />
    </Box>
  );
}
