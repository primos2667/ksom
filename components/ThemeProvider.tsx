"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext<{ theme: string, toggle: () => void }>({ theme: "light", toggle: () => { } });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("ksom-theme");
    const sys = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = saved || sys;
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");

    // Listen to system theme changes - REAL TIME!
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

  if (!mounted) return <>{children}</>;

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
