import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale, type Locale } from "./i18n";

export async function getRequestLocale(): Promise<Locale> {
  const jar = await cookies();
  return normalizeLocale(jar.get(LOCALE_COOKIE)?.value);
}
