import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";

export const metadata: Metadata = {
  title: "Healthy tips",
  description: "Practical healthy eating tips from Balanced Bites.",
};

export default function HealthyTipsPage() {
  return (
    <div className="min-h-full bg-[#f4f1eb] font-sans text-[#426237]">
      <SiteHeader active="learn" orderNowHref="/menu" />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link href="/learn" className="text-sm font-semibold text-[#ac8058] hover:underline">
          ← Back to Learn
        </Link>
        <article className="mt-6 rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-[#426237]/10 sm:p-10">
          <h1 className="menu-serif text-3xl font-semibold">Healthy tips</h1>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            Placeholder. Share batch-cooking ideas, lunchbox wins for kids, and how families use
            Balanced Bites during the week.
          </p>
        </article>
      </main>
      <SiteFooter variant="beige" />
    </div>
  );
}
