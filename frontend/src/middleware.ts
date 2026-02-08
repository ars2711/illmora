import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, locales, type Locale } from "./i18n/config";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.get("NEXT_LOCALE")) {
    const acceptLanguage = request.headers.get("accept-language") ?? "";
    const match = acceptLanguage
      .split(",")
      .map((part) => part.trim().split(";")[0].split("-")[0])
      .find((part) => locales.includes(part as Locale));
    const locale = (match as Locale) ?? defaultLocale;
    response.cookies.set("NEXT_LOCALE", locale, { path: "/" });
  }

  return response;
}

export const config = {
  matcher: ["/", "/((?!api|_next|.*\\..*).*)"],
};
