"use client";

import DownloadIcon from "@mui/icons-material/Download";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
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
import ImportVolunteerModal from "@/components/staff/volunteer-management/import-modal";
import AddVolunteerModal from "@/components/staff/volunteer-management/volunteer-add-modal";
import VolunteerProfile from "@/components/staff/volunteer-management/volunteer-profile";
import {
  type Person,
  type PersonRoleFilter,
  type PersonStatusFilter,
  usePeople,
} from "@/hooks/use-people";
import { useStaffProfile } from "@/hooks/use-staff-profile";
import { useVolunteerDetail } from "@/hooks/use-volunteer-detail";
import { useVolunteerTypes } from "@/hooks/use-volunteer-types";

import PeopleTable from "./people-table";
import AddStaffModal from "./staff-add-modal";
import StaffProfile from "./staff-profile";

export default function PeopleList(): ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<PersonRoleFilter>("");
  const [statusFilter, setStatusFilter] = useState<PersonStatusFilter>("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [alumniFilter, setAlumniFilter] = useState<boolean | undefined>();

  const activeFilterCount =
    (roleFilter ? 1 : 0) +
    (statusFilter ? 1 : 0) +
    (typeFilter ? 1 : 0) +
    (alumniFilter ? 1 : 0);

  const { activeTypes } = useVolunteerTypes();

  const {
    people,
    total,
    grandTotal,
    totalActive,
    page,
    setPage,
    limit,
    setLimit,
    loading,
    error,
    isMutating,
    loadPeople,
    resendCredentials,
  } = usePeople(searchQuery, {
    roleFilter,
    statusFilter,
    typeFilter,
    alumniFilter,
  });

  // Volunteer profile drawer
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<number | null>(
    null,
  );
  const {
    profile: volunteerProfile,
    loading: volunteerProfileLoading,
    error: volunteerProfileError,
    loadProfile: loadVolunteerProfile,
    clearProfile: clearVolunteerProfile,
  } = useVolunteerDetail();

  // Staff profile drawer
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const {
    profile: staffProfile,
    loading: staffProfileLoading,
    error: staffProfileError,
    loadProfile: loadStaffProfile,
    clearProfile: clearStaffProfile,
  } = useStaffProfile();

  const [addStaffModalOpen, setAddStaffModalOpen] = useState(false);
  const [addVolunteerModalOpen, setAddVolunteerModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setSearchQuery(e.target.value);
      setPage(1);
    },
    [setPage],
  );

  const handleRoleFilterChange = useCallback(
    (e: SelectChangeEvent<string>): void => {
      setRoleFilter((e.target.value as PersonRoleFilter) || "");
      setPage(1);
    },
    [setPage],
  );

  const handleStatusFilterChange = useCallback(
    (e: SelectChangeEvent<string>): void => {
      setStatusFilter((e.target.value as PersonStatusFilter) || "");
      setPage(1);
    },
    [setPage],
  );

  const handleFilterTypeChange = useCallback(
    (e: SelectChangeEvent<string>): void => {
      setTypeFilter(e.target.value || undefined);
      setPage(1);
    },
    [setPage],
  );

  const handleFilterAlumniChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setAlumniFilter(e.target.checked ? true : undefined);
      setPage(1);
    },
    [setPage],
  );

  const handleClearFilters = useCallback((): void => {
    setRoleFilter("");
    setStatusFilter("");
    setTypeFilter(undefined);
    setAlumniFilter(undefined);
    setPage(1);
  }, [setPage]);

  const handlePageChange = useCallback(
    (newPage: number): void => setPage(newPage),
    [setPage],
  );

  const handleLimitChange = useCallback(
    (newLimit: number): void => {
      setLimit(newLimit);
      setPage(1);
    },
    [setLimit, setPage],
  );

  const handlePersonClick = useCallback(
    async (person: Person): Promise<void> => {
      if (person.personType === "volunteer") {
        setSelectedVolunteerId(person.id);
        await loadVolunteerProfile(person.id);
      } else {
        setSelectedStaffId(person.id);
        await loadStaffProfile(person.id);
      }
    },
    [loadVolunteerProfile, loadStaffProfile],
  );

  const handleCloseVolunteerDrawer = useCallback((): void => {
    setSelectedVolunteerId(null);
    clearVolunteerProfile();
  }, [clearVolunteerProfile]);

  const handleCloseStaffDrawer = useCallback((): void => {
    setSelectedStaffId(null);
    clearStaffProfile();
  }, [clearStaffProfile]);

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

  // Show pagination only when role-filtered (paginated fetch); hide for "all" (full fetch)
  const showPagination = roleFilter !== "";

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
        eyebrow="Admin Portal"
        title="People"
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
              startIcon={<GroupAddIcon />}
              onClick={() => setAddVolunteerModalOpen(true)}
            >
              Add Volunteer
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setAddStaffModalOpen(true)}
            >
              Add Staff
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
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="role-filter-label">Role</InputLabel>
                <Select
                  labelId="role-filter-label"
                  label="Role"
                  value={roleFilter}
                  onChange={handleRoleFilterChange}
                >
                  <MenuItem value="">All roles</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="volunteer">Volunteer</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
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
                  value={typeFilter ?? ""}
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
                    checked={alumniFilter === true}
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

        <PeopleTable
          people={people}
          total={total}
          page={page}
          limit={limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onPersonClick={(p) => void handlePersonClick(p)}
          loading={loading}
          showPagination={showPagination}
        />
      </Box>

      {/* Volunteer detail drawer */}
      <Drawer
        anchor="right"
        open={selectedVolunteerId !== null}
        onClose={handleCloseVolunteerDrawer}
        PaperProps={{
          sx: { width: 520, display: "flex", flexDirection: "column" },
        }}
      >
        <ModalTitleBar
          title="Volunteer Profile"
          onClose={handleCloseVolunteerDrawer}
        />
        <Box sx={{ flex: 1, overflow: "auto" }}>
          {volunteerProfileLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : volunteerProfileError ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error">{volunteerProfileError}</Alert>
            </Box>
          ) : volunteerProfile ? (
            <VolunteerProfile
              volunteer={volunteerProfile}
              onDelete={() => {
                handleCloseVolunteerDrawer();
                void loadPeople();
              }}
              onVolunteerUpdated={() => {
                if (selectedVolunteerId) {
                  void loadVolunteerProfile(selectedVolunteerId);
                }
              }}
              onResendInvite={() => void handleResendInvite()}
              resendInviteDisabled={isMutating}
            />
          ) : null}
        </Box>
      </Drawer>

      {/* Staff detail drawer */}
      <Drawer
        anchor="right"
        open={selectedStaffId !== null}
        onClose={handleCloseStaffDrawer}
        PaperProps={{
          sx: { width: 520, display: "flex", flexDirection: "column" },
        }}
      >
        <ModalTitleBar title="Staff Profile" onClose={handleCloseStaffDrawer} />
        <Box sx={{ flex: 1, overflow: "auto" }}>
          {staffProfileLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : staffProfileError ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error">{staffProfileError}</Alert>
            </Box>
          ) : staffProfile ? (
            <Box sx={{ pt: 3 }}>
              <StaffProfile profile={staffProfile} />
            </Box>
          ) : null}
        </Box>
      </Drawer>

      <AddStaffModal
        open={addStaffModalOpen}
        onClose={() => setAddStaffModalOpen(false)}
        onCreated={() => {
          void loadPeople();
        }}
      />
      <AddVolunteerModal
        open={addVolunteerModalOpen}
        onClose={() => setAddVolunteerModalOpen(false)}
        onCreated={() => {
          void loadPeople();
        }}
      />
      <ImportVolunteerModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={() => {
          void loadPeople();
        }}
      />
    </Box>
  );
}
