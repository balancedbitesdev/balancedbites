import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";
import { getRequestLocale } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "Keto guides",
  description: "Keto-friendly eating with Balanced Bites.",
};

export default async function KetoGuidesPage() {
  const locale = await getRequestLocale();

  return (
    <div className="min-h-full bg-[#f4f1eb] font-sans text-[#426237]">
      <SiteHeader active={null} orderNowHref="/menu" />
      <main className="mx-auto max-w-3xl px-4 pb-12 pt-3 sm:px-6">
        <Link href="/learn" className="text-sm font-semibold text-[#ac8058] hover:underline">
          {locale === "ar" ? "← رجوع للتعلم" : "← Back to Learn"}
        </Link>
        <article className="mt-4 rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-[#426237]/10 sm:p-10">
          <h1 className="menu-serif text-3xl font-semibold">
            {locale === "ar" ? "دليل الكيتو" : "Keto guides"}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            {locale === "ar"
              ? "هنا هنضيف إرشادات معتمدة عن صافي الكارب، الإلكترولايتس، وأنهي منتجات Balanced Bites مناسبة للكيتو."
              : "Placeholder content. Add your approved guidance on net carbs, electrolytes, and which Balanced Bites SKUs fit a ketogenic pattern."}
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
