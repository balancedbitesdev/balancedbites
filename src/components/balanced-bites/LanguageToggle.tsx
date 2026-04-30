"use client";

import { useRouter } from "next/navigation";
import { alternateLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n";

const ONE_YEAR = 60 * 60 * 24 * 365;

export function LanguageToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const next = alternateLocale(locale);

  return (
    <button
      type="button"
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
        router.refresh();
      }}
      className="rounded-full border border-[#426237]/12 bg-white/70 px-3 py-2 text-xs font-bold text-[#426237] shadow-sm transition-[background-color,transform,color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/35"
      aria-label={next === "ar" ? "Switch to Egyptian Arabic" : "Switch to English"}
    >
      {next === "ar" ? "عربي" : "EN"}
    </button>
  );
}
