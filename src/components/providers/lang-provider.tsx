"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Locale, type TranslationKey } from "@/lib/i18n";

interface LangContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
}

const LangContext = createContext<LangContextType>({
  locale: "ar",
  setLocale: () => {},
  t: (k) => k,
  isRTL: true,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const saved = localStorage.getItem("athar-locale") as Locale;
    if (saved === "ar" || saved === "en") {
      setLocaleState(saved);
      document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("athar-locale", l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  };

  const t = (key: TranslationKey): string => {
    return translations[locale][key] ?? translations.ar[key] ?? key;
  };

  return (
    <LangContext.Provider value={{ locale, setLocale, t, isRTL: locale === "ar" }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
