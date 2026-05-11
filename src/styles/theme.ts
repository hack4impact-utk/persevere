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
    background: {
      default: "#fafafa",
      paper: "#ffffff",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ":root": {
          "--safe-area-inset-top": "env(safe-area-inset-top, 0px)",
          "--safe-area-inset-right": "env(safe-area-inset-right, 0px)",
          "--safe-area-inset-bottom": "env(safe-area-inset-bottom, 0px)",
          "--safe-area-inset-left": "env(safe-area-inset-left, 0px)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
          [t.breakpoints.down("sm")]: {
            minHeight: 44,
          },
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          [t.breakpoints.down("sm")]: {
            minHeight: 44,
            minWidth: 44,
          },
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: ({ theme: t }) => ({
          [t.breakpoints.down("sm")]: {
            fontSize: 16,
          },
        }),
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        input: ({ theme: t }) => ({
          [t.breakpoints.down("sm")]: {
            fontSize: 16,
          },
        }),
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: ({ theme: t }) => ({
          [t.breakpoints.down("sm")]: {
            fontSize: 16,
          },
        }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ ownerState, theme: t }) =>
          ownerState.fullScreen
            ? {
                borderRadius: 0,
                paddingTop: "env(safe-area-inset-top, 0px)",
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
              }
            : {
                borderRadius: 12,
                [t.breakpoints.down("sm")]: {
                  margin: 8,
                  width: "calc(100% - 16px)",
                  maxHeight: "calc(100% - 16px)",
                },
              },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: "1.5rem",
          paddingBottom: 8,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "8px 24px 24px",
          gap: 8,
        },
      },
    },
  },
});

export default theme;
