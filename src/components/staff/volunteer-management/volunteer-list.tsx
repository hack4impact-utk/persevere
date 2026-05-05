"use client";

import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Drawer,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { type ReactElement, useCallback, useState } from "react";

import { FilterDrawer, ModalTitleBar, PageHeader } from "@/components/shared";
import { useVolunteerDetail } from "@/hooks/use-volunteer-detail";
import { useVolunteerTypes } from "@/hooks/use-volunteer-types";
import {
  useVolunteers,
  type VolunteerStatusFilter,
} from "@/hooks/use-volunteers";

import ImportVolunteerModal from "./import-modal";
import AddVolunteerModal from "./volunteer-add-modal";
import VolunteerProfile from "./volunteer-profile";
import VolunteerTable from "./volunteer-table";

export default function VolunteerList(): ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<VolunteerStatusFilter | "">(
    "",
  );

  const [filters, setFilters] = useState<{
    type?: string;
    alumni?: boolean;
  }>({});

  const {
    volunteers,
    total,
    grandTotal,
    totalActive,
    page,
    setPage,
    limit,
    setLimit,
    loading,
    error,
    loadVolunteers,
    resendCredentials,
    isMutating,
  } = useVolunteers(searchQuery, {
    ...filters,
    status: statusFilter || undefined,
  });

  const { activeTypes } = useVolunteerTypes();

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
  const [importModalOpen, setImportModalOpen] = useState(false);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setSearchQuery(event.target.value);
      setPage(1);
    },
    [setPage],
  );

  const handleStatusFilterChange = useCallback(
    (e: SelectChangeEvent<string>): void => {
      setStatusFilter((e.target.value as VolunteerStatusFilter) || "");
      setPage(1);
    },
    [setPage],
  );

  const handleFilterTypeChange = useCallback(
    (e: SelectChangeEvent<string>): void => {
      setFilters((prev) => ({ ...prev, type: e.target.value || undefined }));
      setPage(1);
    },
    [setPage],
  );

  const handleFilterAlumniChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setFilters((prev) => ({
        ...prev,
        alumni: e.target.checked ? true : undefined,
      }));
      setPage(1);
    },
    [setPage],
  );

  const handleClearFilters = useCallback((): void => {
    setStatusFilter("");
    setFilters({});
    setPage(1);
  }, [setPage]);

  const handlePageChange = useCallback(
    (newPage: number): void => {
      setPage(newPage);
    },
    [setPage],
  );

  const handleLimitChange = useCallback(
    (newLimit: number): void => {
      setLimit(newLimit);
      setPage(1);
    },
    [setLimit, setPage],
  );

  const handleVolunteerClick = useCallback(
    async (volunteerId: number): Promise<void> => {
      setSelectedVolunteerId(volunteerId);
      await loadVolunteerProfile(volunteerId);
    },
    [loadVolunteerProfile],
  );

  const handleCloseDrawer = useCallback((): void => {
    setSelectedVolunteerId(null);
    clearProfile();
  }, [clearProfile]);

  const { enqueueSnackbar } = useSnackbar();

  const handleResendInvite = useCallback(async (): Promise<void> => {
    if (!selectedVolunteerId) return;
    const success = await resendCredentials(selectedVolunteerId);
    if (success) {
      enqueueSnackbar("Invite resent successfully", { variant: "success" });
    } else {
      enqueueSnackbar("Failed to resend invite", { variant: "error" });
    }
  }, [selectedVolunteerId, resendCredentials, enqueueSnackbar]);

  const activeFilterCount =
    (statusFilter ? 1 : 0) + (filters.type ? 1 : 0) + (filters.alumni ? 1 : 0);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: { xs: 2, md: 4 },
        overflow: "hidden",
      }}
    >
      {error && (
        <Box sx={{ mb: 2, flexShrink: 0 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <PageHeader
        eyebrow="Staff Portal"
        title="Volunteers"
        subtitle={`${grandTotal} total · ${totalActive} active`}
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => {
                globalThis.location.href = "/api/staff/volunteers/export";
              }}
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => setImportModalOpen(true)}
            >
              Import CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddModalOpen(true)}
            >
              Invite Volunteer
            </Button>
          </>
        }
      />

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
          mt: 2,
        }}
      >
        {/* Toolbar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
            gap: 1.5,
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flex: 1,
              flexWrap: "wrap",
            }}
          >
            <TextField
              size="small"
              label="Search"
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name or email…"
              sx={{ minWidth: 240 }}
            />
            <FilterDrawer
              activeFilterCount={activeFilterCount}
              onClear={handleClearFilters}
            >
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  label="Status"
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="">All statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="type-filter-label">Volunteer Type</InputLabel>
                <Select
                  labelId="type-filter-label"
                  label="Volunteer Type"
                  value={filters.type ?? ""}
                  onChange={handleFilterTypeChange}
                >
                  <MenuItem value="">All types</MenuItem>
                  {activeTypes.map((t) => (
                    <MenuItem key={t.id} value={t.name}>
                      {t.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.alumni === true}
                    onChange={handleFilterAlumniChange}
                  />
                }
                label="Alumni only"
              />
            </FilterDrawer>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {total} result{total === 1 ? "" : "s"}
          </Typography>
        </Box>

        <VolunteerTable
          volunteers={volunteers}
          totalVolunteers={total}
          page={page}
          limit={limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onVolunteerClick={handleVolunteerClick}
          loading={loading}
        />
      </Box>

      {/* Volunteer detail drawer */}
      <Drawer
        anchor="right"
        open={selectedVolunteerId !== null}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: {
            width: 520,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <ModalTitleBar title="Volunteer Profile" onClose={handleCloseDrawer} />
        <Box sx={{ flex: 1, overflow: "auto" }}>
          {profileLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : profileError ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error">{profileError}</Alert>
            </Box>
          ) : volunteerProfile ? (
            <VolunteerProfile
              volunteer={volunteerProfile}
              onDelete={() => {
                handleCloseDrawer();
                void loadVolunteers();
              }}
              onVolunteerUpdated={() => {
                if (selectedVolunteerId) {
                  void handleVolunteerClick(selectedVolunteerId);
                }
              }}
              onResendInvite={() => void handleResendInvite()}
              resendInviteDisabled={isMutating}
            />
          ) : null}
        </Box>
      </Drawer>

      <AddVolunteerModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCreated={() => {
          void loadVolunteers();
        }}
      />
      <ImportVolunteerModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={() => {
          void loadVolunteers();
        }}
      />
    </Box>
  );
}
