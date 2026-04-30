import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";
import { getRequestLocale } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "Healthy tips",
  description: "Practical healthy eating tips from Balanced Bites.",
};

export default async function HealthyTipsPage() {
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
            {locale === "ar" ? "نصايح صحية" : "Healthy tips"}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            {locale === "ar"
              ? "هنا هنشارك أفكار تحضير أسبوعي، لانش بوكس للأطفال، وإزاي العيلة تستخدم Balanced Bites خلال الأسبوع."
              : "Placeholder. Share batch-cooking ideas, lunchbox wins for kids, and how families use Balanced Bites during the week."}
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
