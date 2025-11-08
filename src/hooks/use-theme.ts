import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ThemePreset = "default" | "ocean" | "forest" | "violet" | "rose" | "amber";

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const saved = localStorage.getItem("theme-mode");
    return (saved as ThemeMode) || "system";
  });

  const [preset, setPreset] = useState<ThemePreset>(() => {
    if (typeof window === "undefined") return "default";
    const saved = localStorage.getItem("theme-preset");
    return (saved as ThemePreset) || "default";
  });

  useEffect(() => {
    const applyMode = (target: ThemeMode) => {
      const root = document.documentElement;
      const isDark =
        target === "dark" ||
        (target === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.classList.toggle("dark", !!isDark);
      root.setAttribute("data-theme", target);
    };
    applyMode(mode);

    localStorage.setItem("theme-mode", mode);

    if (mode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyMode("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [mode]);

  useEffect(() => {
    const root = document.documentElement;
    const applyPreset = (name: ThemePreset) => {
      const setVar = (key: string, value?: string) => {
        if (value) {
          root.style.setProperty(key, value);
        } else {
          root.style.removeProperty(key);
        }
      };

      // Reset to defaults by removing overrides
      if (name === "default") {
        setVar("--primary");
        setVar("--primary-foreground");
        setVar("--accent");
        setVar("--accent-foreground");
        setVar("--sidebar-primary");
        setVar("--sidebar-primary-foreground");
        return;
      }

      // Simple color presets using oklch values
      switch (name) {
        case "ocean":
          setVar("--primary", "oklch(0.60 0.18 255)");
          setVar("--primary-foreground", "oklch(0.985 0 0)");
          setVar("--accent", "oklch(0.92 0.08 255)");
          setVar("--accent-foreground", "oklch(0.205 0 0)");
          setVar("--sidebar-primary", "oklch(0.60 0.18 255)");
          setVar("--sidebar-primary-foreground", "oklch(0.985 0 0)");
          break;
        case "forest":
          setVar("--primary", "oklch(0.62 0.18 145)");
          setVar("--primary-foreground", "oklch(0.985 0 0)");
          setVar("--accent", "oklch(0.92 0.08 145)");
          setVar("--accent-foreground", "oklch(0.205 0 0)");
          setVar("--sidebar-primary", "oklch(0.62 0.18 145)");
          setVar("--sidebar-primary-foreground", "oklch(0.985 0 0)");
          break;
        case "violet":
          setVar("--primary", "oklch(0.62 0.21 300)");
          setVar("--primary-foreground", "oklch(0.985 0 0)");
          setVar("--accent", "oklch(0.92 0.10 300)");
          setVar("--accent-foreground", "oklch(0.205 0 0)");
          setVar("--sidebar-primary", "oklch(0.62 0.21 300)");
          setVar("--sidebar-primary-foreground", "oklch(0.985 0 0)");
          break;
        case "rose":
          setVar("--primary", "oklch(0.70 0.25 30)");
          setVar("--primary-foreground", "oklch(0.145 0 0)");
          setVar("--accent", "oklch(0.92 0.12 30)");
          setVar("--accent-foreground", "oklch(0.205 0 0)");
          setVar("--sidebar-primary", "oklch(0.70 0.25 30)");
          setVar("--sidebar-primary-foreground", "oklch(0.145 0 0)");
          break;
        case "amber":
          setVar("--primary", "oklch(0.82 0.19 85)");
          setVar("--primary-foreground", "oklch(0.145 0 0)");
          setVar("--accent", "oklch(0.94 0.12 85)");
          setVar("--accent-foreground", "oklch(0.205 0 0)");
          setVar("--sidebar-primary", "oklch(0.82 0.19 85)");
          setVar("--sidebar-primary-foreground", "oklch(0.145 0 0)");
          break;
      }
    };

    applyPreset(preset);
    localStorage.setItem("theme-preset", preset);
  }, [preset]);

  return {
    mode,
    setMode,
    preset,
    setPreset,
  };
}

export default useTheme;