"use client";

import { useTheme, type ThemePreference } from "@/components/ThemeProvider";

const OPTIONS: ThemePreference[] = ["light", "dark", "system"];

export function ThemeToggle() {
  const { theme, setPreference } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setPreference(nextTheme)}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      <svg className="theme-toggle-sun" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </svg>
      <svg className="theme-toggle-moon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" />
      </svg>
    </button>
  );
}

export function ThemePreferenceControl() {
  const { preference, setPreference } = useTheme();

  return (
    <fieldset className="theme-preference">
      <legend>Appearance</legend>
      <p>Choose a theme for your workspace. System follows your device setting.</p>
      <div className="theme-preference-options" role="group" aria-label="Theme preference">
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className="theme-preference-option"
            aria-pressed={preference === option}
            onClick={() => setPreference(option)}
          >
            {option[0].toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
