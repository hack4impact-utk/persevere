"use client";

import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";
import PersonIcon from "@mui/icons-material/Person";
import {
  Avatar,
  Box,
  CircularProgress,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { type ReactElement, useCallback, useMemo } from "react";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

import { type Volunteer } from "./types";

/**
 * VolunteerTable
 *
 * Displays volunteers in a paginated table. Rows are clickable and trigger
 * the onVolunteerClick callback to open the volunteer profile modal.
 */
type VolunteerTableProps = {
  volunteers: Volunteer[];
  totalVolunteers: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onVolunteerClick: (volunteerId: number) => void;
  loading?: boolean;
};

export default function VolunteerTable({
  volunteers,
  totalVolunteers,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onVolunteerClick,
  loading = false,
}: VolunteerTableProps): ReactElement {
  const handleRowClick = useCallback(
    (volunteerId: number): void => {
      onVolunteerClick(volunteerId);
    },
    [onVolunteerClick],
  );

  const maxPage = useMemo(
    () => Math.ceil(totalVolunteers / limit),
    [totalVolunteers, limit],
  );

  const handleFirstPageButtonClick = useCallback((): void => {
    onPageChange(1);
  }, [onPageChange]);

  const handleBackButtonClick = useCallback((): void => {
    onPageChange(page - 1);
  }, [onPageChange, page]);

  const handleNextButtonClick = useCallback((): void => {
    onPageChange(page + 1);
  }, [onPageChange, page]);

  const handleLastPageButtonClick = useCallback((): void => {
    onPageChange(maxPage);
  }, [onPageChange, maxPage]);

  const handleLimitChange = useCallback(
    (e: SelectChangeEvent<string>): void => {
      const value = e.target.value;
      onLimitChange(Number.parseInt(value, 10));
    },
    [onLimitChange],
  );

  const startIndex = useMemo(() => (page - 1) * limit + 1, [page, limit]);
  const endIndex = useMemo(
    () => Math.min(page * limit, totalVolunteers),
    [page, limit, totalVolunteers],
  );

  return (
    <Paper
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <TableContainer
        sx={{
          flex: 1,
          overflow: "auto",
          maxHeight: "calc(100vh - 300px)",
          position: "relative",
        }}
      >
        {loading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              zIndex: 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <Table stickyHeader aria-label="volunteer table">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Name
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Role
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Hours
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Contact
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {volunteers && volunteers.length > 0 ? (
              volunteers.map((volunteer) => (
                <TableRow
                  key={volunteer.id}
                  onClick={() => handleRowClick(volunteer.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRowClick(volunteer.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View profile for ${volunteer.firstName} ${volunteer.lastName}`}
                  sx={{
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <Avatar
                        src={volunteer.profilePicture || undefined}
                        alt={`${volunteer.firstName} ${volunteer.lastName}`}
                        sx={{ width: 40, height: 40 }}
                      >
                        {!volunteer.profilePicture && <PersonIcon />}
                      </Avatar>
                      <Box>
                        {volunteer.firstName} {volunteer.lastName}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{volunteer.volunteerType || "N/A"}</TableCell>
                  <TableCell>
                    {volunteer.totalHours?.toFixed(1) || "0.0"}
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      <Typography variant="body2">{volunteer.email}</Typography>
                      {volunteer.phone && (
                        <Typography variant="body2" color="text.secondary">
                          {volunteer.phone}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No volunteers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        sx={{
          borderTop: 1,
          borderColor: "divider",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1,
        }}
      >
        {/* Left: Showing results */}
        <Typography variant="body2" color="text.secondary">
          Showing results {startIndex} to {endIndex} out of {totalVolunteers}
        </Typography>

        {/* Middle: Page navigation */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            onClick={handleFirstPageButtonClick}
            disabled={page === 1}
            aria-label="first page"
            size="small"
          >
            <FirstPageIcon />
          </IconButton>
          <IconButton
            onClick={handleBackButtonClick}
            disabled={page === 1}
            aria-label="previous page"
            size="small"
          >
            <KeyboardArrowLeft />
          </IconButton>
          <Typography variant="body2" sx={{ mx: 1 }}>
            Page {page}
          </Typography>
          <IconButton
            onClick={handleNextButtonClick}
            disabled={page >= maxPage}
            aria-label="next page"
            size="small"
          >
            <KeyboardArrowRight />
          </IconButton>
          <IconButton
            onClick={handleLastPageButtonClick}
            disabled={page >= maxPage}
            aria-label="last page"
            size="small"
          >
            <LastPageIcon />
          </IconButton>
        </Box>

        {/* Right: Rows per page */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Rows per page:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 70 }}>
            <Select
              value={String(limit)}
              onChange={handleLimitChange}
              sx={{ fontSize: "0.875rem" }}
            >
              <MenuItem value="5">5</MenuItem>
              <MenuItem value={String(DEFAULT_PAGE_SIZE)}>
                {DEFAULT_PAGE_SIZE}
              </MenuItem>
              <MenuItem value="25">25</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
    </Paper>
  );
}
