'use client';

import { useEffect, useState } from 'react';
import { Box, Button, TextField, Typography, CircularProgress, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VolunteerTable from './volunteer-table';
import { Volunteer, VolunteersResponse } from './types';
import { fetchVolunteers } from './volunteer-service';

export default function VolunteerList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalVolunteers, setTotalVolunteers] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadVolunteers = async () => {
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
      console.error('Failed to fetch volunteers:', error);
      setError('Failed to load volunteers. Please try again later.');
      setVolunteers([]);
      setTotalVolunteers(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadVolunteers();
    }, searchQuery ? 300 : 0);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, page, limit]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  const handleAddVolunteer = () => {
    console.log('Add volunteer clicked');
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Volunteers
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddVolunteer}
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
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
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