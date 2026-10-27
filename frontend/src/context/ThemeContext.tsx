import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleDark: () => void;
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  isLargeText: boolean;
  toggleLargeText: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem("cih_theme") === "dark" || 
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    return localStorage.getItem("cih_contrast") === "high";
  });

  const [isLargeText, setIsLargeText] = useState<boolean>(() => {
    return localStorage.getItem("cih_text_scale") === "large";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("cih_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("cih_theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    const root = document.documentElement;
    if (isHighContrast) {
      root.classList.add("high-contrast");
      localStorage.setItem("cih_contrast", "high");
    } else {
      root.classList.remove("high-contrast");
      localStorage.setItem("cih_contrast", "normal");
    }
  }, [isHighContrast]);

  useEffect(() => {
    const root = document.documentElement;
    if (isLargeText) {
      root.classList.add("text-large");
      localStorage.setItem("cih_text_scale", "large");
    } else {
      root.classList.remove("text-large");
      localStorage.setItem("cih_text_scale", "normal");
    }
  }, [isLargeText]);

  const toggleDark = () => setIsDark(prev => !prev);
  const toggleHighContrast = () => setIsHighContrast(prev => !prev);
  const toggleLargeText = () => setIsLargeText(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, isHighContrast, toggleHighContrast, isLargeText, toggleLargeText }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
