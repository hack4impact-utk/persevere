"use client";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import { type ReactElement } from "react";

import { type Volunteer } from "./types";

type VolunteerTableProps = {
  volunteers: Volunteer[];
  totalVolunteers: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
};

export default function VolunteerTable({
  volunteers,
  totalVolunteers,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: VolunteerTableProps): ReactElement {
  const handleChangePage = (_event: unknown, newPage: number): void => {
    onPageChange(newPage + 1);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    onLimitChange(Number.parseInt(event.target.value, 10));
  };

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer>
        <Table stickyHeader aria-label="volunteer table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Type</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {volunteers && volunteers.length > 0 ? (
              volunteers.map((volunteer) => (
                <TableRow key={volunteer.id}>
                  <TableCell>
                    {volunteer.firstName} {volunteer.lastName}
                  </TableCell>
                  <TableCell>{volunteer.email}</TableCell>
                  <TableCell>{volunteer.volunteerType || "N/A"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No volunteers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalVolunteers}
        rowsPerPage={limit}
        page={page - 1}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
