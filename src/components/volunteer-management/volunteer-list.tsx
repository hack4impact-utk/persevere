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
import { type ReactElement, useCallback, useEffect, useState } from "react";

import { type Volunteer } from "./types";
import AddVolunteerModal from "./volunteer-add-modal";
import VolunteerProfile from "./volunteer-profile";
import {
  fetchVolunteerById,
  type FetchVolunteerByIdResult,
  fetchVolunteers,
} from "./volunteer-service";
import VolunteerTable from "./volunteer-table";

export default function VolunteerList(): ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalVolunteers, setTotalVolunteers] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<number | null>(
    null,
  );
  const [volunteerProfile, setVolunteerProfile] =
    useState<FetchVolunteerByIdResult | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [addModalOpen, setAddModalOpen] = useState(false);

  const loadVolunteers = async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetchVolunteers({
        search: searchQuery,
        page,
        limit,
      });
      setVolunteers(response.volunteers || []);
      setTotalVolunteers(response.total || 0);
    } catch (error) {
      console.error("Failed to fetch volunteers:", error);
      setError("Failed to load volunteers. Please try again later.");
      setVolunteers([]);
      setTotalVolunteers(0);
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
  }, [searchQuery, page, limit]);

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  const onAddVolunteer = useCallback((): void => {
    setAddModalOpen(true);
  }, []);

  const handlePageChange = (newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number): void => {
    setLimit(newLimit);
    setPage(1);
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
          placeholder="Search by name..."
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
        <VolunteerTable
          volunteers={volunteers}
          totalVolunteers={totalVolunteers}
          page={page}
          limit={limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onVolunteerClick={handleVolunteerClick}
        />
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
      <AddVolunteerModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </Box>
  );
}
