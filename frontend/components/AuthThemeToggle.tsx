"use client";

import { ThemeToggle } from "./ThemeToggle";

interface AuthThemeToggleProps {
  className?: string;
}

/**
 * Small wrapper to keep the auth pages' theme toggle in a consistent spot.
 * Helps avoid regressions where the toggle disappears from login/signup.
 */
export function AuthThemeToggle({ className = "absolute top-6 right-6" }: AuthThemeToggleProps) {
  return (
    <div className={className}>
      <ThemeToggle />
    </div>
  );
}
