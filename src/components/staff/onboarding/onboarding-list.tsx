"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { type ChangeEvent, type ReactElement, useCallback } from "react";

import { useStaffOnboarding } from "@/hooks/use-staff-onboarding";

export default function OnboardingList(): ReactElement {
  const {
    volunteers,
    total,
    isLoading,
    error,
    page,
    setPage,
    search,
    setSearch,
  } = useStaffOnboarding();

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setPage(1);
    },
    [setSearch, setPage],
  );

  const handlePageChange = useCallback(
    (_: unknown, newPage: number) => {
      setPage(newPage + 1);
    },
    [setPage],
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Onboarding
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Track volunteer onboarding progress and completion status.
      </Typography>

      <TextField
        placeholder="Search volunteers..."
        value={search}
        onChange={handleSearchChange}
        size="small"
        sx={{ mb: 2, minWidth: 300 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      {isLoading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && error && <Alert severity="error">{error}</Alert>}

      {!isLoading && !error && (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Profile</TableCell>
                  <TableCell>Availability</TableCell>
                  <TableCell>Skills</TableCell>
                  <TableCell>Interests</TableCell>
                  <TableCell>Media Release</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {volunteers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ py: 2 }}
                      >
                        No volunteers found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {volunteers.map((v) => (
                  <TableRow key={v.volunteerId} hover>
                    <TableCell>
                      {v.firstName} {v.lastName}
                    </TableCell>
                    <TableCell>{v.email}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={v.completionPercentage}
                          sx={{ flex: 1, height: 6, borderRadius: 3 }}
                          color={
                            v.completionPercentage === 100
                              ? "success"
                              : "primary"
                          }
                        />
                        <Typography variant="caption" sx={{ minWidth: 32 }}>
                          {v.completionPercentage}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {v.onboardingComplete ? (
                        <Chip
                          label="Complete"
                          color="success"
                          size="small"
                          icon={<CheckCircleIcon />}
                        />
                      ) : (
                        <Chip label="Incomplete" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <StepIcon done={v.checklist.profileFilled} />
                    </TableCell>
                    <TableCell>
                      <StepIcon done={v.checklist.availabilitySet} />
                    </TableCell>
                    <TableCell>
                      <StepIcon done={v.checklist.skillsAdded} />
                    </TableCell>
                    <TableCell>
                      <StepIcon done={v.checklist.interestsAdded} />
                    </TableCell>
                    <TableCell>
                      <StepIcon done={v.checklist.mediaReleaseSigned} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page - 1}
            onPageChange={handlePageChange}
            rowsPerPage={10}
            rowsPerPageOptions={[10]}
          />
        </>
      )}
    </Box>
  );
}

function StepIcon({ done }: { done: boolean }): ReactElement {
  return done ? (
    <CheckCircleIcon color="success" fontSize="small" />
  ) : (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: "2px solid",
        borderColor: "divider",
      }}
    />
  );
}
