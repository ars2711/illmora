import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";

export default getRequestConfig(async () => {
  const cookieLocale = cookies().get("NEXT_LOCALE")?.value;
  const acceptLanguage = headers().get("accept-language") ?? "";

  const pickLocale = (value: string | undefined) => {
    if (!value) return defaultLocale;
    const match = value
      .split(",")
      .map((part) => part.trim().split(";")[0])
      .map((part) => part.split("-")[0])
      .find((part) => locales.includes(part as Locale));
    return (match as Locale) ?? defaultLocale;
  };

  const resolvedLocale = cookieLocale
    ? pickLocale(cookieLocale)
    : pickLocale(acceptLanguage);

  return {
    locale: resolvedLocale,
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default,
  };
});
