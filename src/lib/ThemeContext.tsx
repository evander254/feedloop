import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { getTheme } from "@/lib/theme";

type Mode = "light" | "dark";

interface ThemeContextValue {
  mode: Mode;
  toggleMode: () => void;
  setMode: (mode: Mode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  toggleMode: () => {},
  setMode: () => {},
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => {
    const stored = localStorage.getItem("theme-mode");
    if (stored === "dark" || stored === "light") return stored;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  });

  useEffect(() => {
    localStorage.setItem("theme-mode", mode);
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  const theme = useMemo(() => getTheme(mode), [mode]);
  const toggleMode = () => setMode((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, setMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
