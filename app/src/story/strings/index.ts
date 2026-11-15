/** The story's own UI strings (the app's i18n files are not edited). mn is marked needs-native-proof. */
import { useCallback } from "react";
import { format, useI18n, type MessageParams } from "../../i18n";
import en from "./en.json";
import mn from "./mn.json";

export type StoryKey = Exclude<keyof typeof en, "_status">;

const table: Record<"en" | "mn", Record<StoryKey, string>> = { en, mn };

/** The text for `key` in `lang`; falls back to English when a Mongolian string is missing. */
export function storyText(lang: "en" | "mn", key: StoryKey, params?: MessageParams): string {
  return format(table[lang][key] || table.en[key], params);
}

export function useStoryText() {
  const { lang } = useI18n();
  return useCallback((key: StoryKey, params?: MessageParams) => storyText(lang, key, params), [lang]);
}
