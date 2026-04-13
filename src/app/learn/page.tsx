import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";

export const metadata: Metadata = {
  title: "Learn | Balanced Bites",
  description: "Nutrition hub: basics, keto, healthy habits, and founder-led content.",
};

const CARDS = [
  {
    href: "/learn/nutrition-basics",
    title: "Nutrition basics",
    desc: "Core ideas behind balanced plates, macros, and everyday fuel.",
  },
  {
    href: "/learn/keto-guides",
    title: "Keto guides",
    desc: "How we think about low-carb and ketogenic-friendly options.",
  },
  {
    href: "/learn/healthy-tips",
    title: "Healthy tips",
    desc: "Practical habits for busy schedules and family tables.",
  },
  {
    href: "/learn/founder-videos",
    title: "Founder videos",
    desc: "Messages and kitchen notes from Dalia and the Balanced Bites team.",
  },
] as const;

export default function LearnHubPage() {
  return (
    <div className="min-h-full bg-[#f4f1eb] font-sans text-[#426237]">
      <SiteHeader active="learn" orderNowHref="/menu" />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#426237]/70">
          Nutrition hub
        </p>
        <h1 className="menu-serif mt-3 text-4xl font-semibold tracking-tight">Learn</h1>
        <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-gray-600">
          Short reads and videos to help your household eat well without overwhelm. New lessons
          roll out here first.
        </p>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {CARDS.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className="block h-full rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-[#426237]/10 transition-shadow hover:shadow-md"
              >
                <h2 className="text-xl font-semibold text-[#426237]">{c.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{c.desc}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-[#ac8058]">
                  Read more →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <SiteFooter />
    </div>
  );
}
