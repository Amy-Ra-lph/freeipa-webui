import React from "react";

const STORAGE_KEY = "ipa-theme";
const DARK_CLASS = "pf-v6-theme-dark";

type ThemeMode = "light" | "dark" | "auto";

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  cycleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue>({
  mode: "auto",
  isDark: false,
  cycleTheme: () => {},
});

function getStoredMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return "auto";
}

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return systemPrefersDark();
}

function applyTheme(isDark: boolean) {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add(DARK_CLASS);
  } else {
    root.classList.remove(DARK_CLASS);
  }
}

const CYCLE: Record<ThemeMode, ThemeMode> = {
  light: "dark",
  dark: "auto",
  auto: "light",
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = React.useState<ThemeMode>(() => {
    const m = getStoredMode();
    applyTheme(resolveIsDark(m));
    return m;
  });

  const [isDark, setIsDark] = React.useState(() => resolveIsDark(mode));

  // Listen for system theme changes when in auto mode
  React.useEffect(() => {
    if (mode !== "auto") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      applyTheme(e.matches);
      setIsDark(e.matches);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [mode]);

  const cycleTheme = React.useCallback(() => {
    setMode((prev) => {
      const next = CYCLE[prev];
      const dark = resolveIsDark(next);
      applyTheme(dark);
      setIsDark(dark);
      if (next === "auto") {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, next);
      }
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({ mode, isDark, cycleTheme }),
    [mode, isDark, cycleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => React.useContext(ThemeContext);
