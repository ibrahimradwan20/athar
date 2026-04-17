"use client";

import { useLang } from "@/components/providers/lang-provider";

export default function LangToggle() {
  const { locale, setLocale } = useLang();

  return (
    <button
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
    >
    </button>
  );
}
