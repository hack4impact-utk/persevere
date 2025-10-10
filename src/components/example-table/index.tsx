"use client";

import Search from "@mui/icons-material/Search";
import { Box, TextField, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { ReactNode, useState } from "react";

import { Volunteer } from "@/types/schema";

type ExampleTableProps = {
  volunteers: Volunteer[];
};

type Row = Pick<Volunteer, "id" | "firstName" | "lastName" | "email">;

const columns: GridColDef<Row>[] = [
  { field: "id", headerName: "ID", width: 100, flex: 1 },
  { field: "firstName", headerName: "First Name", width: 150, flex: 1 },
  { field: "lastName", headerName: "Last Name", width: 150, flex: 1 },
  { field: "email", headerName: "Email", width: 200, flex: 1 },
];

function getRows(volunteers: Volunteer[], searchQuery: string): Row[] {
  const rows = volunteers.map((volunteer) => ({
    id: volunteer.id,
    firstName: volunteer.firstName,
    lastName: volunteer.lastName,
    email: volunteer.email,
  }));

  return rows.filter(
    (row) =>
      `${row?.firstName} ${row?.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      row?.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );
}

export default function ExampleTable({
  volunteers,
}: ExampleTableProps): ReactNode {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRows = getRows(volunteers, searchQuery);

  return (
    <Box sx={{ height: "75vh", width: "75vw" }}>
      <Typography align="center" variant="h6">
        Volunteers
      </Typography>
      <Box
        sx={{
          width: "100%",
          marginInline: "auto",
        }}
      >
        <Box display="flex" alignItems="center" sx={{ py: 2 }}>
          <TextField
            id="search-bar"
            className="text"
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            placeholder="Search..."
            size="small"
          />
          <Search sx={{ fontSize: 28, m: 1 }} color="primary" />
        </Box>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          disableRowSelectionOnClick
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 8,
              },
            },
          }}
          sx={{
            height: "500px",
          }}
        />
      </Box>
    </Box>
  );
}
