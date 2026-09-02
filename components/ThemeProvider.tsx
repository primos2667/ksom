"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext<{ theme: string, toggle: () => void, isDark: boolean }>({ theme: "light", toggle: () => { }, isDark: false });

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem('ksom-theme') as "light" | "dark" | null;
    if (saved) return saved;
    // If blocking script already set class, use it
    if (document.documentElement.classList.contains("dark")) return "dark";
    if (document.documentElement.classList.contains("light")) return "light";
    // Fallback to system
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    // Ensure html class matches state on mount (in case blocking script missed)
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("ksom-theme")) {
        const newTheme = e.matches ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const toggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("ksom-theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return <ThemeContext.Provider value={{ theme, toggle, isDark: theme === "dark" }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
