"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getTranslation, SUPPORTED_LANGUAGES, Language } from "@/lib/translations";

interface LanguageContextProps {
  language: string | null;
  setLanguage: (lang: string | null) => void;
  t: (key: string) => string;
  supportedLanguages: Language[];
  currentLanguageInfo: Language | undefined;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nagrik_selected_language");
      if (saved) {
        setLanguageState(saved);
      }
      setMounted(true);
    }
  }, []);

  const setLanguage = (lang: string | null) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      if (lang) {
        localStorage.setItem("nagrik_selected_language", lang);
      } else {
        localStorage.removeItem("nagrik_selected_language");
      }
    }
  };

  const t = (key: string) => {
    return getTranslation(language || "en", key);
  };

  const currentLanguageInfo = SUPPORTED_LANGUAGES.find((l) => l.code === language);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
        currentLanguageInfo,
      }}
    >
      {mounted ? children : <div className="h-dvh w-full bg-background" />}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
