"use client";

import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";
import {
  Box,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Typography,
} from "@mui/material";
import { type ReactElement, useCallback, useMemo } from "react";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

type TablePaginationFooterProps = {
  total: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
};

export function TablePaginationFooter({
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: TablePaginationFooterProps): ReactElement {
  const maxPage = useMemo(() => Math.ceil(total / limit), [total, limit]);
  const startIndex = useMemo(() => (page - 1) * limit + 1, [page, limit]);
  const endIndex = useMemo(
    () => Math.min(page * limit, total),
    [page, limit, total],
  );

  const handleFirstPage = useCallback((): void => {
    onPageChange(1);
  }, [onPageChange]);

  const handlePrevPage = useCallback((): void => {
    onPageChange(page - 1);
  }, [onPageChange, page]);

  const handleNextPage = useCallback((): void => {
    onPageChange(page + 1);
  }, [onPageChange, page]);

  const handleLastPage = useCallback((): void => {
    onPageChange(maxPage);
  }, [onPageChange, maxPage]);

  const handleLimitChange = useCallback(
    (e: SelectChangeEvent<string>): void => {
      onLimitChange(Number.parseInt(e.target.value, 10));
    },
    [onLimitChange],
  );

  return (
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
      <Typography variant="body2" color="text.secondary">
        Showing results {startIndex} to {endIndex} out of {total}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          onClick={handleFirstPage}
          disabled={page === 1}
          aria-label="first page"
          size="small"
        >
          <FirstPageIcon />
        </IconButton>
        <IconButton
          onClick={handlePrevPage}
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
          onClick={handleNextPage}
          disabled={page >= maxPage}
          aria-label="next page"
          size="small"
        >
          <KeyboardArrowRight />
        </IconButton>
        <IconButton
          onClick={handleLastPage}
          disabled={page >= maxPage}
          aria-label="last page"
          size="small"
        >
          <LastPageIcon />
        </IconButton>
      </Box>

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
  );
}
