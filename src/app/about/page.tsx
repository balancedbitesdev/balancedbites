import type { Metadata } from "next";
import Image from "next/image";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";

export const metadata: Metadata = {
  title: "About Us | Balanced Bites",
  description:
    "Learn about Balanced Bites and founder Dalia Seoudi, certified food nutritionist.",
};

export default function AboutPage() {
  return (
    <div className="min-h-full bg-[#f4f1eb] font-sans text-[#426237]">
      <SiteHeader active="about" orderNowHref="/menu" />

      <main className="mx-auto max-w-4xl px-4 pb-12 pt-3 sm:px-6 sm:pb-16 sm:pt-4">
        <article className="overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-[#426237]/10">
          <div className="px-8 pb-10 pt-4 sm:px-12 sm:pb-12 sm:pt-6">
            <h1 className="menu-serif text-4xl font-semibold tracking-tight">About Us</h1>

            <div className="mt-8 space-y-6 text-pretty text-base leading-relaxed text-gray-700">
              <p>
                Balanced Bites is a health-focused food brand dedicated to delivering nutritious,
                clean, and flavorful meals crafted from premium natural ingredients. Founded in 2025 by
                Dalia Seoudi, a certified food nutritionist, the brand was created to make healthy
                eating enjoyable, convenient, and accessible for all.
              </p>
              <p>
                Built on scientific nutrition foundations and real client experience, Balanced Bites
                offers a complete range of wholesome foods designed to support long-term healthy
                lifestyles—without compromising taste or satisfaction.
              </p>
            </div>
          </div>

          {/* Founder spotlight — portrait + story */}
          <div className="relative border-t border-[#426237]/10 bg-gradient-to-b from-[#fbf9f5] via-white to-[#f4f1eb]/30 px-6 py-12 sm:px-10 sm:py-14">
            <div
              className="pointer-events-none absolute left-12 top-10 h-28 w-28 rounded-full bg-[#426237]/8 blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute right-6 top-12 h-36 w-36 rounded-full bg-[#ac8058]/10 blur-3xl"
              aria-hidden
            />

            <div className="relative grid items-start gap-10 lg:grid-cols-[minmax(280px,340px)_1fr] lg:gap-14">
              <div className="mx-auto w-full max-w-[21rem] lg:mx-0">
                <figure className="relative rounded-[2rem] bg-white p-4 shadow-[0_24px_60px_-28px_rgba(66,98,55,0.35)] ring-1 ring-[#426237]/10 sm:p-5">
                  <div
                    className="absolute inset-x-6 -top-3 h-8 rounded-full bg-[#426237]/8 blur-xl"
                    aria-hidden
                  />
                  <div className="relative overflow-hidden rounded-[1.5rem] bg-[#f6f2eb] ring-1 ring-[#426237]/8">
                    <div className="border-b border-[#426237]/8 px-5 py-3">
                      <span className="inline-flex items-center rounded-full bg-[#426237]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#426237]">
                        Founded by Dalia
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
                      Certified food nutritionist
                    </p>
                  </figcaption>
                </figure>
              </div>

              <div className="pt-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ac8058]">
                  Founder Spotlight
                </p>
                <h2 className="menu-serif mt-3 text-2xl font-semibold text-[#426237] sm:text-3xl">
                  The person behind the menu
                </h2>
                <p className="mt-3 max-w-prose text-sm leading-relaxed text-gray-500">
                  Nutrition, taste, and honesty on the plate—by design.
                </p>
                <div className="mt-8 space-y-6 text-pretty text-base leading-relaxed text-gray-700">
                  <p>
                    As a certified food nutritionist with nearly a year of hands-on experience
                    developing personalized healthy eating plans, Dalia Seoudi brings deep knowledge of
                    clean eating, balanced meal creation, and ingredient integrity.
                  </p>
                  <p>
                    Her goal is to support individuals in achieving better health by offering meals
                    and desserts that reflect both nutritional value and culinary enjoyment. Inspired
                    by real transformations, Dalia founded Balanced Bites to provide clean,
                    delicious, and nutritionist-approved options for everyday life.
                  </p>
                </div>
                <div className="mt-8 rounded-[1.5rem] border border-[#426237]/10 bg-white/80 px-5 py-4 shadow-sm">
                  <p className="menu-serif text-lg font-semibold text-[#426237]">
                    Clean food should feel warm, generous, and easy to trust.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
