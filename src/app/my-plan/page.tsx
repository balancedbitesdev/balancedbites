import type { Metadata } from "next";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";
import { getRequestLocale } from "@/lib/i18n-server";
import { PlanInquiryForm } from "./PlanInquiryForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Custom Plan | Balanced Bites",
  description:
    "Request a personalized eating plan from our nutritionist. Tell us your goals and we'll follow up with the plan that fits you best.",
};

const WHATSAPP_E164 =
  process.env.NEXT_PUBLIC_WHATSAPP_E164 ?? "201000000000";
const WHATSAPP_DIGITS = WHATSAPP_E164.replace(/\D/g, "");
const WHATSAPP_GENERAL = `https://wa.me/${WHATSAPP_DIGITS}?text=${encodeURIComponent(
  "Hi Balanced Bites! I'd like more info about your custom eating plans.",
)}`;

const PAGE_COPY = {
  en: {
    eyebrow: "Personalized Nutrition Plan",
    title: "Get Your Personalized Diet Plan",
    intro:
      "fill in your details to receive a customized plan based on your body and goals",
    tiers: [
      {
        badge: "Starter",
        title: "1-Month Plan",
        blurb: "A focused start to reset your habits and understand your body.",
        highlights: [
          "Personalized nutrition plan",
          "Weekly meal plan guidance",
          "Simple, sustainable approach",
          "Ongoing support via email",
        ],
      },
      {
        badge: "Committed",
        title: "3-Month Plan",
        blurb: "Build consistency and start seeing real, lasting results.",
        highlights: [
          "Everything in Starter",
          "Monthly plan updates",
          "Progress tracking & adjustments",
          "Priority support",
        ],
      },
      {
        badge: "Transform",
        title: "6-Month Plan",
        blurb: "A complete transformation with deeper support and long-term results.",
        highlights: [
          "Everything in 3-Month Plan",
          "Bi-weekly adjustments",
          "Direct WhatsApp support",
          "Habit-building system",
        ],
      },
    ],
    pricing: "Pricing shared privately after we've reviewed your goals -",
    quote: "or message us on WhatsApp for a quick quote",
    mostPopular: "Most popular",
  },
  ar: {
    eyebrow: "خطة تغذية مخصصة",
    title: "احصل على خطة تغذيتك المخصصة",
    intro:
      "املا تفاصيلك لاستلام خطة مخصصة بناءً على جسمك وأهدافك",
    tiers: [
      {
        badge: "بداية",
        title: "خطة شهر",
        blurb: "أول شهر مركز مع خطة مخصوصة ودعم من أخصائية التغذية.",
        highlights: ["ماكروز مخصوصة", "توجيه أسبوعي للوجبات", "دعم بالإيميل"],
      },
      {
        badge: "التزام",
        title: "خطة ٣ شهور",
        blurb: "نتايج ثابتة مع متابعة شهرية وتعديلات على الخطة.",
        highlights: ["كل حاجة في خطة الشهر", "تحديث شهري للخطة", "ردود أسرع"],
      },
      {
        badge: "تحول",
        title: "خطة ٦ شهور",
        blurb: "دعم أعمق لتغيير العادات والوصول لتحول طويل المدى.",
        highlights: ["كل حاجة في خطة ٣ شهور", "تعديلات كل أسبوعين", "خط واتساب مباشر"],
      },
    ],
    pricing: "السعر بيتبعت بشكل خاص بعد ما نراجع هدفك -",
    quote: "أو كلمنا على واتساب لسعر سريع",
    mostPopular: "الأكثر طلبًا",
  },
} as const;

export default async function MyPlanPage() {
  const locale = await getRequestLocale();
  const copy = PAGE_COPY[locale];

  return (
    <div className="min-h-full bg-gradient-to-b from-[#f4f1eb] via-[#f4f1eb] to-[#e8e4dc] font-sans text-[#426237]">
      <SiteHeader active="my-plan" orderNowHref="/menu" />

      <main>
        <section
          className="mx-auto max-w-3xl px-4 pb-2 pt-3 text-center sm:px-6 sm:pt-5"
          aria-labelledby="plan-intro"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#426237]/70">
            {copy.eyebrow}
          </p>
          <h1
            id="plan-intro"
            className="menu-serif mt-3 text-3xl font-semibold tracking-tight sm:text-[2.75rem]"
          >
            {copy.title}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-gray-600 sm:text-base">
            {copy.intro}
          </p>
        </section>

        <section
          className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 sm:pt-12"
          aria-label="Subscription tiers"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {copy.tiers.map((tier, index) => (
              <TierCard
                key={tier.title}
                badge={tier.badge}
                title={tier.title}
                blurb={tier.blurb}
                highlights={[...tier.highlights]}
                featured={index === 1}
                mostPopular={copy.mostPopular}
              />
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-[#426237]/55">
            {copy.pricing}{" "}
            <a
              href={WHATSAPP_GENERAL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#426237] underline decoration-[#426237]/30 underline-offset-2 hover:text-[#2c4224]"
            >
              {copy.quote}
            </a>
            .
          </p>
        </section>

        <PlanInquiryForm />
      </main>

      <SiteFooter />
    </div>
  );
}

function TierCard({
  badge,
  title,
  blurb,
  highlights,
  featured,
  mostPopular,
}: {
  badge: string;
  title: string;
  blurb: string;
  highlights: string[];
  featured?: boolean;
  mostPopular: string;
}) {
  return (
    <div
      className={`relative rounded-[1.5rem] border p-5 transition-[border-color,box-shadow,transform] duration-200 ease-out sm:p-6 ${
        featured
          ? "border-[#426237]/30 bg-white shadow-[0_24px_55px_-28px_rgba(66,98,55,0.45)]"
          : "border-[#426237]/12 bg-white/80 shadow-sm hover:-translate-y-0.5 hover:border-[#426237]/25 hover:bg-white"
      }`}
    >
      {featured ? (
        <span className="absolute -top-3 left-5 inline-flex items-center rounded-full bg-[#426237] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
          {mostPopular}
        </span>
      ) : null}
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ac8058]">
        {badge}
      </p>
      <h3 className="menu-serif mt-2 text-xl font-semibold text-[#426237]">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{blurb}</p>
      <ul className="mt-4 space-y-2 text-sm text-[#426237]/80">
        {highlights.map((h) => (
          <li key={h} className="flex items-start gap-2">
            <span
              aria-hidden
              className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ac8058]"
            />
            {h}
          </li>
        ))}
      </ul>
    </div>
  );
}
