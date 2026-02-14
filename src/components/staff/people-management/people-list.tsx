"use client";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
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

import VolunteerList from "@/components/staff/volunteer-management/volunteer-list";
import { useStaff } from "@/hooks/use-staff";
import {
  fetchStaffById,
  type FetchStaffByIdResult,
} from "@/services/staff.service";

import AddStaffModal from "./staff-add-modal";
import StaffTable from "./staff-table";

/**
 * PeopleList
 *
 * Main people management page component for admins. Displays two tabs:
 * 1. Volunteers - Shows volunteer management (reuses VolunteerList)
 * 2. Staff - Shows staff management with ability to add staff
 */
export default function PeopleList(): ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState(0);
  const [staffTab, setStaffTab] = useState(0); // Staff sub-tabs: 0=Active, 1=Inactive, 2=Pending
  const [staffFilters, setStaffFilters] = useState<{
    role?: "admin" | "staff";
  }>({});

  const {
    activeStaff,
    totalActiveStaff,
    activePage: activeStaffPage,
    setActivePage: setActiveStaffPage,
    inactiveStaff,
    totalInactiveStaff,
    inactivePage: inactiveStaffPage,
    setInactivePage: setInactiveStaffPage,
    pendingStaff,
    totalPendingStaff,
    pendingPage: pendingStaffPage,
    setPendingPage: setPendingStaffPage,
    limit: staffLimit,
    setLimit: setStaffLimit,
    loading: staffLoading,
    error: staffError,
    loadStaff,
  } = useStaff(searchQuery, staffFilters);

  // Staff profile state
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [staffProfile, setStaffProfile] = useState<FetchStaffByIdResult | null>(
    null,
  );
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setSearchQuery(event.target.value);
      if (currentTab === 1) {
        setActiveStaffPage(1);
        setInactiveStaffPage(1);
        setPendingStaffPage(1);
      }
    },
    [currentTab, setActiveStaffPage, setInactiveStaffPage, setPendingStaffPage],
  );

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: number): void => {
      setCurrentTab(newValue);
      setSearchQuery("");
      if (newValue === 1) {
        void loadStaff();
      }
    },
    [loadStaff],
  );

  const handleStaffTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: number): void => {
      setStaffTab(newValue);
      setSearchQuery("");
    },
    [],
  );

  const handleFilterRoleChange = useCallback(
    (e: SelectChangeEvent<string>): void => {
      setStaffFilters((prev) => ({
        ...prev,
        role:
          e.target.value === ""
            ? undefined
            : (e.target.value as "admin" | "staff"),
      }));
      setActiveStaffPage(1);
      setInactiveStaffPage(1);
      setPendingStaffPage(1);
    },
    [setActiveStaffPage, setInactiveStaffPage, setPendingStaffPage],
  );

  const handleClearFilters = useCallback((): void => {
    setStaffFilters({});
    setActiveStaffPage(1);
    setInactiveStaffPage(1);
    setPendingStaffPage(1);
  }, [setActiveStaffPage, setInactiveStaffPage, setPendingStaffPage]);

  const handleActiveStaffPageChange = useCallback(
    (newPage: number): void => {
      setActiveStaffPage(newPage);
    },
    [setActiveStaffPage],
  );

  const handleInactiveStaffPageChange = useCallback(
    (newPage: number): void => {
      setInactiveStaffPage(newPage);
    },
    [setInactiveStaffPage],
  );

  const handlePendingStaffPageChange = useCallback(
    (newPage: number): void => {
      setPendingStaffPage(newPage);
    },
    [setPendingStaffPage],
  );

  const handleStaffLimitChange = useCallback(
    (newLimit: number): void => {
      setStaffLimit(newLimit);
      setActiveStaffPage(1);
      setInactiveStaffPage(1);
      setPendingStaffPage(1);
    },
    [
      setStaffLimit,
      setActiveStaffPage,
      setInactiveStaffPage,
      setPendingStaffPage,
    ],
  );

  const onAddStaff = useCallback((): void => {
    setAddModalOpen(true);
  }, []);

  const handleStaffClick = useCallback(
    async (staffId: number): Promise<void> => {
      setSelectedStaffId(staffId);
      setProfileLoading(true);
      setProfileError(null);
      try {
        const data = await fetchStaffById(staffId);
        setStaffProfile(data);
      } catch (error) {
        console.error("Failed to fetch staff profile:", error);
        setProfileError("Failed to load staff profile. Please try again.");
        setStaffProfile(null);
      } finally {
        setProfileLoading(false);
      }
    },
    [],
  );

  const handleCloseModal = useCallback((): void => {
    setSelectedStaffId(null);
    setStaffProfile(null);
    setProfileError(null);
  }, []);

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
        People
      </Typography>

      {staffError && currentTab === 1 && (
        <Box sx={{ mb: 3, flexShrink: 0 }}>
          <Alert severity="error">{staffError}</Alert>
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
            aria-label="people tabs"
            sx={{ flex: 1, minWidth: 0 }}
          >
            <Tab label="Volunteers" />
            <Tab label="Staff" />
          </Tabs>
        </Box>

        {/* Volunteers Tab */}
        {currentTab === 0 && (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                "& > div": {
                  height: "100% !important",
                  padding: "0 !important",
                },
                // Hide the "Volunteers" heading when rendered inside PeopleList
                "& h1.MuiTypography-h4": {
                  display: "none",
                },
              }}
            >
              <VolunteerList />
            </Box>
          </Box>
        )}

        {/* Staff Tab */}
        {currentTab === 1 && (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
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
                value={staffTab}
                onChange={handleStaffTabChange}
                aria-label="staff tabs"
                sx={{ flex: 1, minWidth: 0 }}
              >
                <Tab label="Active Staff" />
                <Tab label="Inactive Staff" />
                <Tab
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <span>Pending Invites</span>
                      {totalPendingStaff > 0 && (
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
                          {totalPendingStaff}
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
                        Object.keys(staffFilters).length > 0
                          ? "primary.main"
                          : "transparent",
                      color:
                        Object.keys(staffFilters).length > 0
                          ? "primary.contrastText"
                          : "primary.main",
                      "&:hover": {
                        backgroundColor:
                          Object.keys(staffFilters).length > 0
                            ? "primary.dark"
                            : "action.hover",
                      },
                    }}
                  >
                    <FilterListIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Add Staff Member">
                  <IconButton
                    color="primary"
                    onClick={onAddStaff}
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

            {/* Active Staff Tab */}
            {staffTab === 0 && (
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <StaffTable
                  staff={activeStaff}
                  totalStaff={totalActiveStaff}
                  page={activeStaffPage}
                  limit={staffLimit}
                  onPageChange={handleActiveStaffPageChange}
                  onLimitChange={handleStaffLimitChange}
                  onStaffClick={handleStaffClick}
                  loading={staffLoading}
                />
              </Box>
            )}

            {/* Inactive Staff Tab */}
            {staffTab === 1 && (
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <StaffTable
                  staff={inactiveStaff}
                  totalStaff={totalInactiveStaff}
                  page={inactiveStaffPage}
                  limit={staffLimit}
                  onPageChange={handleInactiveStaffPageChange}
                  onLimitChange={handleStaffLimitChange}
                  onStaffClick={handleStaffClick}
                  loading={staffLoading}
                />
              </Box>
            )}

            {/* Pending Invites Tab */}
            {staffTab === 2 && (
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <StaffTable
                  staff={pendingStaff}
                  totalStaff={totalPendingStaff}
                  page={pendingStaffPage}
                  limit={staffLimit}
                  onPageChange={handlePendingStaffPageChange}
                  onLimitChange={handleStaffLimitChange}
                  onStaffClick={handleStaffClick}
                  loading={staffLoading}
                />
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Staff Profile Modal */}
      <Dialog
        open={selectedStaffId !== null}
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
            <Typography variant="h6">Staff Profile</Typography>
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
          ) : staffProfile ? (
            <Stack spacing={2} sx={{ py: 2 }}>
              <Typography variant="h6">
                {staffProfile.users?.firstName} {staffProfile.users?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Email: {staffProfile.users?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Phone: {staffProfile.users?.phone || "N/A"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Role: {staffProfile.isAdmin ? "Admin" : "Staff"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: {staffProfile.users?.isActive ? "Active" : "Inactive"}
              </Typography>
            </Stack>
          ) : null}
        </DialogContent>
      </Dialog>

      <AddStaffModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCreated={() => {
          void loadStaff();
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
              Filter Staff
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
                Role
              </Typography>
              <FormControl fullWidth>
                <InputLabel id="filter-role-label" shrink>
                  Role
                </InputLabel>
                <Select
                  labelId="filter-role-label"
                  label="Role"
                  value={staffFilters.role || ""}
                  onChange={handleFilterRoleChange}
                  displayEmpty
                  notched
                >
                  <MenuItem value="">
                    <em>All Roles</em>
                  </MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5 }}>
          <Button
            onClick={handleClearFilters}
            disabled={Object.keys(staffFilters).length === 0}
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
