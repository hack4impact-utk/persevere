"use client";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { type ReactElement, useCallback, useState } from "react";

import { useVolunteerDetail } from "@/hooks/use-volunteer-detail";
import { useVolunteers } from "@/hooks/use-volunteers";

import PendingInvitesTable from "./pending-invites-table";
import AddVolunteerModal from "./volunteer-add-modal";
import VolunteerProfile from "./volunteer-profile";
import VolunteerTable from "./volunteer-table";

/**
 * VolunteerList
 *
 * Main volunteer management page component. Displays three tables in tabs:
 * 1. Active Volunteers (email verified and active)
 * 2. Inactive Volunteers (email verified but inactive)
 * 3. Pending Invites (email not yet verified)
 *
 * All tables share a single search box that searches all tables simultaneously.
 */
export default function VolunteerList(): ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState(0);

  const [filters, setFilters] = useState<{
    type?: string;
    alumni?: boolean;
  }>({});

  const {
    activeVolunteers,
    totalActiveVolunteers,
    activePage,
    setActivePage,
    inactiveVolunteers,
    totalInactiveVolunteers,
    inactivePage,
    setInactivePage,
    pendingInvites,
    totalPendingInvites,
    pendingPage,
    setPendingPage,
    limit,
    setLimit,
    loading,
    error,
    loadVolunteers,
  } = useVolunteers(searchQuery, filters);

  // Profile modal state
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<number | null>(
    null,
  );
  const {
    profile: volunteerProfile,
    loading: profileLoading,
    error: profileError,
    loadProfile: loadVolunteerProfile,
    clearProfile,
  } = useVolunteerDetail();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setSearchQuery(event.target.value);
      // Reset pages when search changes
      setActivePage(1);
      setInactivePage(1);
      setPendingPage(1);
    },
    [setActivePage, setInactivePage, setPendingPage],
  );

  const handleFilterTypeChange = useCallback(
    (e: SelectChangeEvent<string>): void => {
      setFilters((prev) => ({
        ...prev,
        type: e.target.value || undefined,
      }));
      // Reset pages when filters change
      setActivePage(1);
      setInactivePage(1);
      setPendingPage(1);
    },
    [setActivePage, setInactivePage, setPendingPage],
  );

  const handleFilterAlumniChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setFilters((prev) => ({
        ...prev,
        alumni: e.target.checked ? true : undefined,
      }));
      // Reset pages when filters change
      setActivePage(1);
      setInactivePage(1);
      setPendingPage(1);
    },
    [setActivePage, setInactivePage, setPendingPage],
  );

  const handleClearFilters = useCallback((): void => {
    setFilters({});
    setActivePage(1);
    setInactivePage(1);
    setPendingPage(1);
  }, [setActivePage, setInactivePage, setPendingPage]);

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: number): void => {
      setCurrentTab(newValue);
    },
    [],
  );

  const handleInactivePageChange = useCallback((newPage: number): void => {
    setInactivePage(newPage);
  }, []);

  const handleLimitChange = useCallback(
    (newLimit: number): void => {
      setLimit(newLimit);
      // Reset to page 1 when limit changes
      setActivePage(1);
      setInactivePage(1);
      setPendingPage(1);
    },
    [setLimit, setActivePage, setInactivePage, setPendingPage],
  );

  const onAddVolunteer = useCallback((): void => {
    setAddModalOpen(true);
  }, []);

  const handleActivePageChange = useCallback((newPage: number): void => {
    setActivePage(newPage);
  }, []);

  const handlePendingPageChange = useCallback((newPage: number): void => {
    setPendingPage(newPage);
  }, []);

  const handleVolunteerClick = useCallback(
    async (volunteerId: number): Promise<void> => {
      setSelectedVolunteerId(volunteerId);
      await loadVolunteerProfile(volunteerId);
    },
    [loadVolunteerProfile],
  );

  const handleCloseModal = useCallback((): void => {
    setSelectedVolunteerId(null);
    clearProfile();
  }, [clearProfile]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        p: 3,
        overflow: "hidden",
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{
          mb: 3,
          flexShrink: 0,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          fontSize: "2rem",
        }}
      >
        Volunteers
      </Typography>

      {error && (
        <Box sx={{ mb: 3, flexShrink: 0 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            gap: 2,
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="volunteer tabs"
            sx={{ flex: 1, minWidth: 0 }}
          >
            <Tab label="Active Volunteers" />
            <Tab label="Inactive Volunteers" />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span>Pending Invites</span>
                  {totalPendingInvites > 0 && (
                    <Box
                      sx={{
                        backgroundColor: "primary.main",
                        color: "primary.contrastText",
                        borderRadius: "12px",
                        px: 1,
                        py: 0.25,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        minWidth: "20px",
                        textAlign: "center",
                      }}
                    >
                      {totalPendingInvites}
                    </Box>
                  )}
                </Box>
              }
            />
          </Tabs>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexShrink: 0,
            }}
          >
            <TextField
              size="small"
              label="Search"
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name or email..."
              sx={{ minWidth: 250 }}
            />
            <Tooltip title="Filter">
              <IconButton
                color="primary"
                onClick={() => setFilterModalOpen(true)}
                sx={{
                  backgroundColor:
                    Object.keys(filters).length > 0
                      ? "primary.main"
                      : "transparent",
                  color:
                    Object.keys(filters).length > 0
                      ? "primary.contrastText"
                      : "primary.main",
                  "&:hover": {
                    backgroundColor:
                      Object.keys(filters).length > 0
                        ? "primary.dark"
                        : "action.hover",
                  },
                }}
              >
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add Volunteer">
              <IconButton
                color="primary"
                onClick={onAddVolunteer}
                sx={{
                  backgroundColor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Active Volunteers Tab */}
        {currentTab === 0 && (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <VolunteerTable
              volunteers={activeVolunteers}
              totalVolunteers={totalActiveVolunteers}
              page={activePage}
              limit={limit}
              onPageChange={handleActivePageChange}
              onLimitChange={handleLimitChange}
              onVolunteerClick={handleVolunteerClick}
              loading={loading}
            />
          </Box>
        )}

        {/* Inactive Volunteers Tab */}
        {currentTab === 1 && (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <VolunteerTable
              volunteers={inactiveVolunteers}
              totalVolunteers={totalInactiveVolunteers}
              page={inactivePage}
              limit={limit}
              onPageChange={handleInactivePageChange}
              onLimitChange={handleLimitChange}
              onVolunteerClick={handleVolunteerClick}
              loading={loading}
            />
          </Box>
        )}

        {/* Pending Invites Tab */}
        {currentTab === 2 && (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <PendingInvitesTable
              volunteers={pendingInvites}
              totalVolunteers={totalPendingInvites}
              page={pendingPage}
              limit={limit}
              onPageChange={handlePendingPageChange}
              onLimitChange={handleLimitChange}
              onVolunteerClick={handleVolunteerClick}
              onRefresh={loadVolunteers}
              loading={loading}
            />
          </Box>
        )}
      </Box>

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
            <VolunteerProfile
              volunteer={volunteerProfile}
              onDelete={() => {
                setSelectedVolunteerId(null);
                clearProfile();
                void loadVolunteers();
              }}
              onVolunteerUpdated={() => {
                if (selectedVolunteerId) {
                  void handleVolunteerClick(selectedVolunteerId);
                }
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <AddVolunteerModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCreated={() => {
          void loadVolunteers();
        }}
      />

      {/* Filter Modal */}
      <Dialog
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            pt: 3,
            px: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h5" component="div" fontWeight={600}>
              Filter Volunteers
            </Typography>
            <IconButton
              onClick={() => setFilterModalOpen(false)}
              sx={{ color: (theme) => theme.palette.grey[500] }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Volunteer Type
              </Typography>
              <FormControl fullWidth>
                <InputLabel id="filter-type-label" shrink>
                  Volunteer Type
                </InputLabel>
                <Select
                  labelId="filter-type-label"
                  label="Volunteer Type"
                  value={filters.type || ""}
                  onChange={handleFilterTypeChange}
                  displayEmpty
                  notched
                >
                  <MenuItem value="">
                    <em>All Types</em>
                  </MenuItem>
                  <MenuItem value="mentor">Mentor</MenuItem>
                  <MenuItem value="speaker">Speaker</MenuItem>
                  <MenuItem value="flexible">Flexible</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Additional Filters
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.alumni === true}
                      onChange={handleFilterAlumniChange}
                    />
                  }
                  label="Alumni only"
                />
              </FormGroup>
            </Box>
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5 }}>
          <Button
            onClick={handleClearFilters}
            disabled={
              Object.keys(filters).length === 0 ||
              (filters.type === undefined && filters.alumni === undefined)
            }
          >
            Clear Filters
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setFilterModalOpen(false)} variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
