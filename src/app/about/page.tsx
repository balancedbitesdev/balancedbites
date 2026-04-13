import type { Metadata } from "next";
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

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <article className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-[#426237]/10 sm:p-12">
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

          <h2 className="menu-serif mt-12 text-2xl font-semibold text-[#426237]">
            Founder – Dalia Seoudi
          </h2>
          <div className="mt-6 space-y-6 text-pretty text-base leading-relaxed text-gray-700">
            <p>
              As a certified food nutritionist with nearly a year of hands-on experience
              developing personalized healthy eating plans, Dalia Seoudi brings deep knowledge of
              clean eating, balanced meal creation, and ingredient integrity.
            </p>
            <p>
              Her goal is to support individuals in achieving better health by offering meals and
              desserts that reflect both nutritional value and culinary enjoyment. Inspired by real
              transformations, Dalia founded Balanced Bites to provide clean, delicious, and
              nutritionist-approved options for everyday life.
            </p>
          </div>
        </article>
      </main>

      <SiteFooter variant="beige" />
    </div>
  );
}
