"use client";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import PendingInvitesTable from "./pending-invites-table";
import { type Volunteer } from "./types";
import VolunteerProfile from "./volunteer-profile";
import {
  AuthenticationError,
  fetchActiveVolunteers,
  fetchPendingInvites,
  fetchVolunteerById,
  type FetchVolunteerByIdResult,
} from "./volunteer-service";
import VolunteerTable from "./volunteer-table";

/**
 * VolunteerList
 *
 * Main volunteer management page component. Displays two tables:
 * 1. Active Volunteers (email verified)
 * 2. Pending Invites (email not yet verified)
 *
 * Both tables share a single search box that searches both tables simultaneously.
 */
const handleAddVolunteer = (): void => {
  // TODO: Implement volunteer creation
  void 0;
};

export default function VolunteerList(): ReactElement {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Active volunteers state
  const [activeVolunteers, setActiveVolunteers] = useState<Volunteer[]>([]);
  const [totalActiveVolunteers, setTotalActiveVolunteers] = useState(0);
  const [activePage, setActivePage] = useState(1);

  // Pending invites state
  const [pendingInvites, setPendingInvites] = useState<Volunteer[]>([]);
  const [totalPendingInvites, setTotalPendingInvites] = useState(0);
  const [pendingPage, setPendingPage] = useState(1);

  // Shared state
  const limit = 10;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<number | null>(
    null,
  );
  const [volunteerProfile, setVolunteerProfile] =
    useState<FetchVolunteerByIdResult | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadVolunteers = async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      // Fetch both active and pending volunteers with the same search query
      const [activeResponse, pendingResponse] = await Promise.all([
        fetchActiveVolunteers({
          search: searchQuery,
          page: activePage,
          limit,
        }),
        fetchPendingInvites({
          search: searchQuery,
          page: pendingPage,
          limit,
        }),
      ]);

      setActiveVolunteers(activeResponse.volunteers || []);
      setTotalActiveVolunteers(activeResponse.total || 0);

      setPendingInvites(pendingResponse.volunteers || []);
      setTotalPendingInvites(pendingResponse.total || 0);
    } catch (error) {
      // Handle authentication errors silently (redirect will happen)
      if (error instanceof AuthenticationError) {
        router.push("/auth/login");
        return;
      }

      console.error("Failed to fetch volunteers:", error);
      setError("Failed to load volunteers. Please try again later.");
      setActiveVolunteers([]);
      setTotalActiveVolunteers(0);
      setPendingInvites([]);
      setTotalPendingInvites(0);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search to avoid excessive API calls
  useEffect(() => {
    const debounceTimer = setTimeout(
      () => {
        void loadVolunteers();
      },
      searchQuery ? 300 : 0,
    );

    return (): void => {
      clearTimeout(debounceTimer);
    };
  }, [searchQuery, activePage, pendingPage, limit]);

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setSearchQuery(event.target.value);
    // Reset pages when search changes
    setActivePage(1);
    setPendingPage(1);
  };

  const onAddVolunteer = useCallback((): void => {
    handleAddVolunteer();
  }, []);

  const handleActivePageChange = (newPage: number): void => {
    setActivePage(newPage);
  };

  const handlePendingPageChange = (newPage: number): void => {
    setPendingPage(newPage);
  };

  const handleVolunteerClick = async (volunteerId: number): Promise<void> => {
    setSelectedVolunteerId(volunteerId);
    setProfileLoading(true);
    setProfileError(null);
    try {
      const data = await fetchVolunteerById(volunteerId);
      setVolunteerProfile(data);
    } catch (error) {
      console.error("Failed to fetch volunteer profile:", error);
      setProfileError("Failed to load volunteer profile. Please try again.");
      setVolunteerProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCloseModal = (): void => {
    setSelectedVolunteerId(null);
    setVolunteerProfile(null);
    setProfileError(null);
  };

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Volunteers
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAddVolunteer}
        >
          Add Volunteer
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Search volunteers"
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by name or email..."
        />
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Active Volunteers Table */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Active Volunteers
            </Typography>
            <VolunteerTable
              volunteers={activeVolunteers}
              totalVolunteers={totalActiveVolunteers}
              page={activePage}
              limit={limit}
              onPageChange={handleActivePageChange}
              onLimitChange={(): void => {
                // Note: keeping limit constant for both tables for simplicity
              }}
              onVolunteerClick={handleVolunteerClick}
            />
          </Box>

          {/* Pending Invites Table */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Pending Invites
            </Typography>
            <PendingInvitesTable
              volunteers={pendingInvites}
              totalVolunteers={totalPendingInvites}
              page={pendingPage}
              limit={limit}
              onPageChange={handlePendingPageChange}
              onLimitChange={(): void => {
                // Note: keeping limit constant for both tables for simplicity
              }}
              onVolunteerClick={handleVolunteerClick}
            />
          </Box>
        </>
      )}

      {/* Profile modal opens when a volunteer row is clicked */}
      <Dialog
        open={selectedVolunteerId !== null}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Volunteer Profile</Typography>
            <IconButton
              aria-label="close"
              onClick={handleCloseModal}
              sx={{ color: (theme) => theme.palette.grey[500] }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {profileLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : profileError ? (
            <Alert severity="error">{profileError}</Alert>
          ) : volunteerProfile ? (
            <VolunteerProfile volunteer={volunteerProfile} />
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
