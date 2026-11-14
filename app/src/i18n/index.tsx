import { createContext, useContext, useState, type ReactNode } from "react";
import en from "./en.json";
import mn from "./mn.json";

export type Lang = "en" | "mn";
export type MessageKey = keyof typeof en;

const messages: Record<Lang, Record<MessageKey, string>> = { en, mn };

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: MessageKey) => string;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const t = (key: MessageKey) => messages[lang][key] ?? messages.en[key];
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
