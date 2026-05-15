"use client";

import {
  Avatar,
  Box,
  Card,
  Chip,
  type ChipProps,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { type ReactElement, useCallback } from "react";

import { ResponsiveTable, TablePaginationFooter } from "@/components/shared";
import { EmptyState } from "@/components/ui";
import type { Person, PersonRole } from "@/hooks/use-people";

type PersonStatus = "Active" | "Onboarding" | "Pending" | "Inactive";

const STATUS_COLOR: Record<PersonStatus, ChipProps["color"]> = {
  Active: "success",
  Onboarding: "warning",
  Pending: "primary",
  Inactive: "default",
};

const ROLE_META: Record<
  PersonRole,
  { label: string; color: ChipProps["color"] }
> = {
  admin: { label: "Admin", color: "primary" },
  staff: { label: "Staff", color: "default" },
  volunteer: { label: "Volunteer", color: "secondary" },
};

function deriveStatus(p: Person): PersonStatus {
  if (!p.isEmailVerified) return "Pending";
  if (!p.isActive) return "Inactive";
  if (p.personType === "volunteer" && (p.completionPercentage ?? 100) < 100)
    return "Onboarding";
  return "Active";
}

function fmtJoined(d?: Date): string {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    year: "numeric",
  });
}

type PeopleTableProps = {
  people: Person[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onPersonClick: (person: Person) => void;
  loading?: boolean;
  showPagination?: boolean;
};

export default function PeopleTable({
  people,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onPersonClick,
  loading = false,
  showPagination = true,
}: PeopleTableProps): ReactElement {
  const handleRowClick = useCallback(
    (person: Person): void => {
      onPersonClick(person);
    },
    [onPersonClick],
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
      <ResponsiveTable
        desktop={
          <TableContainer
            sx={{ flex: 1, overflow: "auto", position: "relative" }}
          >
            {loading && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.8)",
                  zIndex: 1,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <Table stickyHeader aria-label="people table">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      width: "35%",
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      width: "13%",
                    }}
                  >
                    Role
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      width: "13%",
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      width: "10%",
                    }}
                  >
                    Hours
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      width: "14%",
                    }}
                  >
                    Joined
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {people.length > 0 ? (
                  people.map((person) => {
                    const status = deriveStatus(person);
                    const roleMeta = ROLE_META[person.personType];
                    return (
                      <TableRow
                        key={person.key}
                        onClick={() => handleRowClick(person)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleRowClick(person);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`View profile for ${person.firstName} ${person.lastName}`}
                        sx={{
                          cursor: "pointer",
                          "&:hover": { backgroundColor: "action.hover" },
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
                              src={person.profilePicture || undefined}
                              alt={`${person.firstName} ${person.lastName}`}
                              sx={{ width: 32, height: 32, fontSize: 12 }}
                            >
                              {`${person.firstName?.[0] ?? ""}${person.lastName?.[0] ?? ""}`.toUpperCase() ||
                                "?"}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: "text.primary",
                                  lineHeight: 1.3,
                                }}
                              >
                                {person.firstName} {person.lastName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {person.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={roleMeta.label}
                            color={roleMeta.color}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={status}
                            color={STATUS_COLOR[status]}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{
                              fontVariantNumeric: "tabular-nums",
                              fontWeight: 500,
                              color:
                                person.personType === "volunteer"
                                  ? "text.primary"
                                  : "text.disabled",
                            }}
                          >
                            {person.personType === "volunteer"
                              ? (person.totalHours ?? 0).toFixed(1)
                              : "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {fmtJoined(person.createdAt)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : loading ? null : (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState message="No people found" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        }
        mobile={
          <Box sx={{ flex: 1, overflow: "auto", position: "relative" }}>
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  py: 6,
                }}
              >
                <CircularProgress />
              </Box>
            ) : people.length === 0 ? (
              <EmptyState message="No people found" />
            ) : (
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 1, p: 1 }}
              >
                {people.map((person) => {
                  const status = deriveStatus(person);
                  const roleMeta = ROLE_META[person.personType];
                  const initials =
                    `${person.firstName?.[0] ?? ""}${person.lastName?.[0] ?? ""}`.toUpperCase() ||
                    "?";
                  return (
                    <Card
                      key={person.key}
                      variant="outlined"
                      onClick={() => handleRowClick(person)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          p: 1.5,
                          gap: 1.5,
                        }}
                      >
                        <Avatar
                          src={person.profilePicture || undefined}
                          alt={`${person.firstName} ${person.lastName}`}
                          sx={{
                            width: 40,
                            height: 40,
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          {initials}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {person.firstName} {person.lastName}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            noWrap
                          >
                            {person.email}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.75,
                              mt: 0.5,
                              flexWrap: "wrap",
                            }}
                          >
                            <Chip
                              label={roleMeta.label}
                              color={roleMeta.color}
                              variant="outlined"
                              size="small"
                            />
                            <Chip
                              label={status}
                              color={STATUS_COLOR[status]}
                              variant="outlined"
                              size="small"
                            />
                            <Typography
                              variant="caption"
                              color={
                                person.personType === "volunteer"
                                  ? "text.secondary"
                                  : "text.disabled"
                              }
                            >
                              {person.personType === "volunteer"
                                ? `${(person.totalHours ?? 0).toFixed(1)} hrs`
                                : "—"}{" "}
                              · {fmtJoined(person.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Box>
        }
      />
      {showPagination && (
        <TablePaginationFooter
          total={total}
          page={page}
          limit={limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      )}
    </Paper>
  );
}
