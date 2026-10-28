"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  preference: ThemePreference;
  theme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

const STORAGE_KEY = "tarn-theme";
const COOKIE_NAME = "tarn-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);
let transitionTimer: number | undefined;

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function readThemePreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isThemePreference(stored)) return stored;
  } catch (error) {
    console.error("Unable to read the saved theme preference from local storage.", error);
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (cookie && isThemePreference(cookie)) return cookie;
  return "system";
}

function resolveTheme(preference: ThemePreference, systemIsDark: boolean): ResolvedTheme {
  return preference === "system"
    ? systemIsDark ? "dark" : "light"
    : preference;
}

function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  if (root.dataset.theme === theme) return;

  if (transitionTimer !== undefined) window.clearTimeout(transitionTimer);
  root.classList.add("theme-transitioning");
  root.dataset.theme = theme;
  transitionTimer = window.setTimeout(
    () => root.classList.remove("theme-transitioning"),
    150,
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [theme, setTheme] = useState<ResolvedTheme>("dark");
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const storedPreference = readThemePreference();
    setPreferenceState(storedPreference);
    setReady(true);
  }, []);

  useLayoutEffect(() => {
    if (!ready) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyPreference = () => {
      const resolved = resolveTheme(preference, media.matches);
      applyTheme(resolved);
      setTheme(resolved);
    };

    applyPreference();
    media.addEventListener("change", applyPreference);
    return () => media.removeEventListener("change", applyPreference);
  }, [preference, ready]);

  useEffect(() => () => {
    document.documentElement.dataset.theme = "dark";
  }, []);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, nextPreference);
    } catch (error) {
      console.error("Unable to save the theme preference in local storage.", error);
    }

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE_NAME}=${nextPreference}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    setPreferenceState(nextPreference);
  }, []);

  const value = useMemo(
    () => ({ preference, theme, setPreference }),
    [preference, theme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
