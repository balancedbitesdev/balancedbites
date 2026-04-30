import type { Metadata } from "next";
import Image from "next/image";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";
import { getDictionary } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "About Us | Balanced Bites",
  description:
    "Learn about Balanced Bites and founder Dalia Seoudi, certified food nutritionist.",
};

export default async function AboutPage() {
  const locale = await getRequestLocale();
  const t = getDictionary(locale);

  return (
    <div className="min-h-full bg-[#f4f1eb] font-sans text-[#426237]">
      <SiteHeader active="about" orderNowHref="/menu" />

      <main className="mx-auto max-w-4xl px-4 pb-12 pt-3 sm:px-6 sm:pb-16 sm:pt-4">
        <article className="overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-[#426237]/10">
          {/* Founder spotlight — portrait + story (leads the page) */}
          <div className="relative bg-gradient-to-b from-[#fbf9f5] via-white to-[#f4f1eb]/30 px-6 pb-12 pt-8 sm:px-10 sm:pb-14 sm:pt-10">
            <div
              className="pointer-events-none absolute left-12 top-10 h-28 w-28 rounded-full bg-[#426237]/8 blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute right-6 top-12 h-36 w-36 rounded-full bg-[#ac8058]/10 blur-3xl"
              aria-hidden
            />

            <p className="relative text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ac8058]">
              {t.about.eyebrow}
            </p>

            <div className="relative mt-4 grid items-start gap-10 lg:grid-cols-[minmax(280px,340px)_1fr] lg:gap-14">
              <div className="mx-auto w-full max-w-[21rem] lg:mx-0">
                <figure className="relative rounded-[2rem] bg-white p-4 shadow-[0_24px_60px_-28px_rgba(66,98,55,0.35)] ring-1 ring-[#426237]/10 sm:p-5">
                  <div
                    className="absolute inset-x-6 -top-3 h-8 rounded-full bg-[#426237]/8 blur-xl"
                    aria-hidden
                  />
                  <div className="relative overflow-hidden rounded-[1.5rem] bg-[#f6f2eb] ring-1 ring-[#426237]/8">
                    <div className="border-b border-[#426237]/8 px-5 py-3">
                      <span className="inline-flex items-center rounded-full bg-[#426237]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#426237]">
                        {t.about.founded}
                      </span>
                    </div>
                    <div className="relative aspect-[13/16] w-full overflow-hidden">
                      <Image
                        src="/Dalia.png"
                        alt="Dalia Seoudi, certified food nutritionist and founder of Balanced Bites"
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 1024px) min(90vw, 21rem), 340px"
                        priority
                      />
                    </div>
                  </div>
                  <figcaption className="px-2 pb-2 pt-5 text-center">
                    <p className="menu-serif text-[1.75rem] font-semibold leading-none text-[#426237]">
                      Dalia Seoudi
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#ac8058]">
                      {t.about.role}
                    </p>
                  </figcaption>
                </figure>
              </div>

              <div className="pt-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ac8058]">
                  {t.about.spotlight}
                </p>
                <h1 className="menu-serif mt-3 text-3xl font-semibold tracking-tight text-[#426237] sm:text-[2.5rem]">
                  {t.about.title}
                </h1>
                <p className="mt-3 max-w-prose text-sm leading-relaxed text-gray-500">
                  {t.about.intro}
                </p>
                <div className="mt-8 space-y-6 text-pretty text-base leading-relaxed text-gray-700">
                  <p>
                    {t.about.p1}
                  </p>
                  <p>
                    {t.about.p2}
                  </p>
                </div>
                <div className="mt-8 rounded-[1.5rem] border border-[#426237]/10 bg-white/80 px-5 py-4 shadow-sm">
                  <p className="menu-serif text-lg font-semibold text-[#426237]">
                    {t.about.quote}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Philosophy — hormone-based approach (second) */}
          <div className="border-t border-[#426237]/10 px-8 pb-10 pt-10 sm:px-12 sm:pb-12 sm:pt-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ac8058]">
              {t.about.philosophy}
            </p>
            <h2 className="menu-serif mt-3 text-3xl font-semibold tracking-tight sm:text-[2.25rem]">
              {t.about.philosophyTitle}
            </h2>

            <div className="mt-8 space-y-6 text-pretty text-base leading-relaxed text-gray-700">
              <p>{t.about.philosophyText}</p>
              <p className="menu-serif text-lg font-semibold text-[#426237]">
                {t.about.philosophyClosing}
              </p>
            </div>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
