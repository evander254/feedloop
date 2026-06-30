import { createTheme, type Theme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Theme {
    sidebar: { width: number };
  }
  interface ThemeOptions {
    sidebar?: { width: number };
  }
}

const LIGHT = {
  primary: { main: "#00897A", light: "#26A69A", dark: "#00695C", contrastText: "#ffffff" },
  secondary: { main: "#546E7A", light: "#819CA9", dark: "#29434E" },
  background: { default: "#F5F7FA", paper: "#FFFFFF" },
  text: { primary: "#1A1D23", secondary: "#6B7280", disabled: "#9CA3AF" },
  divider: "#E5E7EB",
  action: { active: "#6B7280", hover: "rgba(0,0,0,0.04)", selected: "rgba(0,137,122,0.08)" },
};

const DARK = {
  primary: { main: "#26C6A0", light: "#4DD0B9", dark: "#00897A", contrastText: "#0A0E17" },
  secondary: { main: "#90A4AE", light: "#B0BEC5", dark: "#546E7A" },
  background: { default: "#0A0E17", paper: "#141B27" },
  text: { primary: "#F1F5F9", secondary: "#94A3B8", disabled: "#475569" },
  divider: "#2A3344",
  action: { active: "#94A3B8", hover: "rgba(255,255,255,0.05)", selected: "rgba(38,198,160,0.12)" },
};

const TYPOGRAPHY = {
  fontFamily: "'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  h4: { fontWeight: 700, fontSize: "1.875rem", lineHeight: 1.2 },
  h5: { fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.3 },
  h6: { fontWeight: 600, fontSize: "1.125rem", lineHeight: 1.3 },
  subtitle1: { fontWeight: 600, fontSize: "1rem", lineHeight: 1.4 },
  subtitle2: { fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.4 },
  body1: { fontSize: "0.875rem", lineHeight: 1.5 },
  body2: { fontSize: "0.75rem", lineHeight: 1.4 },
  caption: { fontSize: "0.75rem", lineHeight: 1.4 },
  overline: { fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" },
};

export function getTheme(mode: "light" | "dark"): Theme {
  const palette = mode === "light" ? LIGHT : DARK;

  return createTheme({
    palette: { mode, ...palette },
    typography: TYPOGRAPHY,
    shape: { borderRadius: 12 },
    sidebar: { width: 240 },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${palette.divider}`,
            boxShadow: mode === "dark"
              ? "0 1px 3px rgba(0,0,0,0.3)"
              : "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.875rem",
            borderRadius: 10,
            padding: "8px 20px",
          },
        },
        defaultProps: {
          disableElevation: false,
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: 10 },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            marginBottom: 2,
            "&.Mui-selected": {
              backgroundColor: palette.primary.main,
              color: palette.primary.contrastText,
              "&:hover": { backgroundColor: palette.primary.dark },
              "& .MuiListItemIcon-root": { color: palette.primary.contrastText },
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: { root: { minWidth: 36 } },
      },
      MuiBadge: {
        styleOverrides: { badge: { fontSize: 10, fontWeight: 700, minWidth: 18, height: 18 } },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 8, fontWeight: 500, fontSize: "0.75rem" } },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: mode === "dark"
            ? { background: "#0D111F", borderRight: `1px solid ${palette.divider}` }
            : { background: palette.background.paper, borderRight: `1px solid ${palette.divider}` },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: "small",
          variant: "outlined",
        },
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 10,
              fontSize: "0.8125rem",
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            fontSize: "0.75rem",
            padding: "6px 12px",
          },
        },
      },
    },
  }) as Theme;
}

export const theme = getTheme("light");
