"use client";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: "var(--font-roboto)",
  },
  palette: {
    mode: "light",
    primary: {
      main: "#327bf7",
      dark: "#27427f",
    },
    secondary: {
      main: "#6b7280",
    },
    error: {
      main: "#d32f2f",
    },
    warning: {
      main: "#ff9800",
    },
    success: {
      main: "#4caf50",
    },
  },
});

export default theme;
