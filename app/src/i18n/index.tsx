import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import en from "./en.json";
import mn from "./mn.json";

export type Lang = "en" | "mn";
export type MessageKey = keyof typeof en;
export type MessageParams = Record<string, string | number>;

const messages: Record<Lang, Record<MessageKey, string>> = { en, mn };

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** The text for `key`; "{name}" placeholders are filled from `params`. */
  t: (key: MessageKey, params?: MessageParams) => string;
}

/** Fill "{name}" placeholders. Unknown placeholders stay as they are, so a missing param is visible in review. */
export function format(template: string, params?: MessageParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const t = useCallback(
    (key: MessageKey, params?: MessageParams) => format(messages[lang][key] ?? messages.en[key], params),
    [lang],
  );
  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
