"use client";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Papa from "papaparse";
import { type ReactElement, useCallback, useRef, useState } from "react";

import { ModalTitleBar } from "@/components/shared";
import { useVolunteerImport } from "@/hooks/use-volunteer-import";

type Stage = "idle" | "preview" | "importing" | "results";

type PreviewRow = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employer: string;
  cityState: string;
};

export type ImportVolunteerModalProps = {
  open: boolean;
  onClose: () => void;
  onImported?: () => void;
};

export default function ImportVolunteerModal({
  open,
  onClose,
  onImported,
}: ImportVolunteerModalProps): ReactElement {
  const [stage, setStage] = useState<Stage>("idle");
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    importing,
    result,
    error: importError,
    importFile,
    reset,
  } = useVolunteerImport();

  const handleClose = useCallback((): void => {
    if (importing) return;
    setStage("idle");
    setParseError(null);
    setPreviewRows([]);
    setTotalRows(0);
    setSelectedFile(null);
    reset();
    onClose();
  }, [importing, reset, onClose]);

  const handleFileSelect = useCallback((file: File): void => {
    setParseError(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(parsed) {
        const headers = parsed.meta.fields ?? [];
        const missing = ["First", "Last", "Email"].filter(
          (h) => !headers.includes(h),
        );
        if (missing.length > 0) {
          setParseError(`Missing required columns: ${missing.join(", ")}`);
          return;
        }

        const rows = parsed.data;
        setTotalRows(rows.length);
        setPreviewRows(
          rows.slice(0, 5).map((row) => ({
            firstName: (row["First"] ?? "").trim(),
            lastName: (row["Last"] ?? "").trim(),
            email: (row["Email"] ?? "").trim(),
            phone: (row["Phone"] ?? "").trim(),
            employer: (row["Employer"] ?? "").trim(),
            cityState: (row["City/State"] ?? "").trim(),
          })),
        );
        setSelectedFile(file);
        setStage("preview");
      },
      error(err) {
        setParseError(`Could not parse CSV: ${err.message}`);
      },
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleImport = useCallback(async (): Promise<void> => {
    if (!selectedFile) return;
    setStage("importing");
    await importFile(selectedFile);
    setStage("results");
    onImported?.();
  }, [selectedFile, importFile, onImported]);

  const handleImportAnother = useCallback((): void => {
    setStage("idle");
    setParseError(null);
    setPreviewRows([]);
    setTotalRows(0);
    setSelectedFile(null);
    reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [reset]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <ModalTitleBar title="Import Volunteers from CSV" onClose={handleClose} />

      <DialogContent dividers>
        {stage === "idle" && (
          <Stack spacing={2}>
            {parseError && <Alert severity="error">{parseError}</Alert>}
            <Box
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: "2px dashed",
                borderColor: "primary.main",
                borderRadius: 2,
                p: 5,
                textAlign: "center",
                cursor: "pointer",
                "&:hover": { backgroundColor: "action.hover" },
              }}
            >
              <UploadFileIcon
                sx={{ fontSize: 48, color: "primary.main", mb: 1 }}
              />
              <Typography variant="body1" fontWeight={500}>
                Drag &amp; drop a CSV file here, or click to browse
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Required columns: First, Last, Email
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                hidden
                onChange={handleInputChange}
              />
            </Box>
          </Stack>
        )}

        {stage === "preview" && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Showing first {previewRows.length} of {totalRows} row
              {totalRows === 1 ? "" : "s"}. Duplicate emails will be skipped.
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>First</TableCell>
                    <TableCell>Last</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Employer</TableCell>
                    <TableCell>City/State</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewRows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.firstName}</TableCell>
                      <TableCell>{row.lastName}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.phone}</TableCell>
                      <TableCell>{row.employer}</TableCell>
                      <TableCell>{row.cityState}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}

        {stage === "importing" && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {stage === "results" && (
          <Stack spacing={2}>
            {importError && <Alert severity="error">{importError}</Alert>}
            {result && (
              <>
                <Stack direction="row" spacing={2}>
                  <Box
                    sx={{
                      flex: 1,
                      p: 2,
                      border: "1px solid",
                      borderColor: "success.main",
                      borderRadius: 1,
                      textAlign: "center",
                    }}
                  >
                    <CheckCircleOutlineIcon color="success" />
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color="success.main"
                    >
                      {result.created}
                    </Typography>
                    <Typography variant="body2">Created</Typography>
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      p: 2,
                      border: "1px solid",
                      borderColor: "warning.main",
                      borderRadius: 1,
                      textAlign: "center",
                    }}
                  >
                    <WarningAmberIcon color="warning" />
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color="warning.main"
                    >
                      {result.skipped}
                    </Typography>
                    <Typography variant="body2">Skipped (duplicate)</Typography>
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      p: 2,
                      border: "1px solid",
                      borderColor:
                        result.errors.length > 0 ? "error.main" : "divider",
                      borderRadius: 1,
                      textAlign: "center",
                    }}
                  >
                    <ErrorOutlineIcon
                      color={result.errors.length > 0 ? "error" : "disabled"}
                    />
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color={
                        result.errors.length > 0
                          ? "error.main"
                          : "text.secondary"
                      }
                    >
                      {result.errors.length}
                    </Typography>
                    <Typography variant="body2">Errors</Typography>
                  </Box>
                </Stack>

                {result.errors.length > 0 && (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Row</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Reason</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.errors.map((err, i) => (
                          <TableRow key={i}>
                            <TableCell>{err.row}</TableCell>
                            <TableCell>{err.email}</TableCell>
                            <TableCell>{err.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {stage === "idle" && (
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
        )}
        {stage === "preview" && (
          <>
            <Button onClick={handleImportAnother} variant="outlined">
              Choose Different File
            </Button>
            <Button onClick={() => void handleImport()} variant="contained">
              Import {totalRows} volunteer{totalRows === 1 ? "" : "s"}
            </Button>
          </>
        )}
        {stage === "results" && (
          <>
            <Button onClick={handleImportAnother} variant="outlined">
              Import Another
            </Button>
            <Button onClick={handleClose} variant="contained">
              Done
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
