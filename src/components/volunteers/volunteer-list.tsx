"use client";

import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import { type Volunteer } from "./types";
import { fetchVolunteers } from "./volunteer-service";
import VolunteerTable from "./volunteer-table";

const handleAddVolunteer = (): void => {
  // Will be implemented later
  void 0;
};

export default function VolunteerList(): ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalVolunteers, setTotalVolunteers] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

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
    handleAddVolunteer();
  }, []);

  const handlePageChange = (newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number): void => {
    setLimit(newLimit);
    setPage(1);
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
        />
      )}
    </Box>
  );
}
