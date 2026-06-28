"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getTranslation, SUPPORTED_LANGUAGES, Language } from "@/lib/translations";

const LANGUAGE_STORAGE_KEY = "nagrik_selected_language";
const LANGUAGE_GATE_VERSION_KEY = "nagrik_language_gate_version";
const LANGUAGE_GATE_VERSION = "india-languages-v1";

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
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      const gateVersion = localStorage.getItem(LANGUAGE_GATE_VERSION_KEY);
      const isSupported = saved ? SUPPORTED_LANGUAGES.some((lang) => lang.code === saved) : false;

      if (gateVersion !== LANGUAGE_GATE_VERSION || !isSupported) {
        localStorage.removeItem(LANGUAGE_STORAGE_KEY);
        localStorage.setItem(LANGUAGE_GATE_VERSION_KEY, LANGUAGE_GATE_VERSION);
      } else if (saved) {
        setLanguageState(saved);
        document.documentElement.lang = saved;
      }
      setMounted(true);
    }
  }, []);

  const setLanguage = (lang: string | null) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      if (lang) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        localStorage.setItem(LANGUAGE_GATE_VERSION_KEY, LANGUAGE_GATE_VERSION);
        document.documentElement.lang = lang;
      } else {
        localStorage.removeItem(LANGUAGE_STORAGE_KEY);
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
