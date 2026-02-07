export const locales = ["en", "es", "ur", "ar", "fr", "hi"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  ur: "اردو",
  ar: "العربية",
  fr: "Français",
  hi: "हिन्दी",
};

export const localeDirection: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  es: "ltr",
  ur: "rtl",
  ar: "rtl",
  fr: "ltr",
  hi: "ltr",
};
