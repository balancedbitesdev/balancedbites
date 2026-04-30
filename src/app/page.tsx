import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";
import { ScrollReveal } from "@/components/balanced-bites/ScrollReveal";
import { getDictionary } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Food for the whole family—balanced meals, clean eating, and natural ingredients. One kitchen, one menu, healthy for everyone.",
};

const WHATSAPP_E164 =
  process.env.NEXT_PUBLIC_WHATSAPP_E164 ?? "201000000000";
const WHATSAPP_DIGITS = WHATSAPP_E164.replace(/\D/g, "");

function tierWhatsAppUrl(tier: string, duration: string, locale: "en" | "ar"): string {
  const message =
    locale === "ar"
      ? `أهلاً Balanced Bites! مهتم بباكدج ${tier} (${duration}). ممكن تبعتولي التفاصيل؟`
      : `Hi Balanced Bites! I'm interested in the ${tier} package (${duration}). Could you share more details?`;
  return `https://wa.me/${WHATSAPP_DIGITS}?text=${encodeURIComponent(message)}`;
}

function HeroChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[#426237]/10 bg-white/85 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#426237]/75 shadow-[0_12px_30px_-18px_rgba(66,98,55,0.35)]">
      {label}
    </span>
  );
}

/** Shared by all floating plates (hero salmon + beef + chicken + vegan): shadow + stacking. */
const FLOATING_PLATE_SHADOW =
  "h-auto w-full select-none drop-shadow-2xl [filter:drop-shadow(0_28px_50px_rgba(66,98,55,0.2))_drop-shadow(0_14px_28px_rgba(0,0,0,0.07))]";

/**
 * Anchoring model: `absolute` inside a `relative` column (hero salmon) or section (chicken, vegan),
 * `pointer-events-none`, `z-20`, width via min(vw) ramp + responsive steps — then add position utilities.
 */
const FLOATING_PLATE_SHELL = "pointer-events-none absolute z-20 max-w-none";

/** Hero salmon width ramp — desktop / `lg+` (bento column). */
const FLOATING_PLATE_WIDTH_SALMON =
  "w-[min(84vw,360px)] sm:w-[min(86vw,410px)] lg:w-[460px]";

/** Hero salmon on phone/tablet: absolute top-right; larger than before, copy stays full width + higher z for readability. */
const FLOATING_PLATE_WIDTH_SALMON_MOBILE =
  "w-[min(48vw,190px)] sm:w-[min(44vw,220px)] md:w-[210px]";

/** Secondary floating plates (chicken, vegan). Same min-vw pattern, one step down from salmon. */
const FLOATING_PLATE_WIDTH_LG =
  "w-[min(88vw,300px)] sm:w-[340px] lg:w-[380px]";

/** Veg bowl beside pricing tiers — smaller + higher anchor so it never covers the footer. */
const FLOATING_PLATE_WIDTH_TIERS_VEGAN =
  "w-[min(58vw,180px)] sm:w-[220px] lg:w-[248px]";

/**
 * Marquee beef — in-flow beside quote. Tighter on phone so copy stays readable in one row.
 */
const FLOATING_PLATE_WIDTH_BEEF =
  "w-[min(30vw,108px)] shrink-0 sm:w-[200px] md:w-[240px] lg:w-[280px]";

export default async function Home() {
  const locale = await getRequestLocale();
  const t = getDictionary(locale);

  return (
    <div className="flex min-h-full flex-col overflow-x-clip bg-[#fffdf9] font-sans text-[#426237]">
      <SiteHeader active="home" orderNowHref="/menu" warmCanvas />

      <main className="flex flex-1 flex-col">
        {/* ──────────────────── HERO (dedicated band) ──────────────────── */}
        <section
          className="relative overflow-x-clip overflow-y-visible bg-gradient-to-b from-[#fffdf9] via-[#f5f0e8] to-[#ebe4d9] px-3 pb-14 pt-2 sm:px-8 sm:pb-20 sm:pt-4 lg:overflow-visible"
          aria-label="Introduction"
        >
          
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.32]"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(ellipse 140% 90% at 50% -30%, rgba(66,98,55,0.06), transparent 50%), radial-gradient(circle at 92% 8%, rgba(172,128,88,0.09), transparent 32%)",
            }}
          />

          <div className="relative mx-auto max-w-6xl pt-3 pb-8 sm:pt-4 sm:pb-12 lg:pt-6 lg:pb-16">
            <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] lg:items-center lg:gap-12">
                  {/* Left — copy; mobile salmon layered top-right (full-width copy, plate absolute) */}
                  <div className="max-w-2xl">
                    <div className="relative isolate">
                      <div
                        className={`pointer-events-none absolute top-[-0.75rem] z-10 ${FLOATING_PLATE_WIDTH_SALMON_MOBILE} ${
                          locale === "ar"
                            ? "-left-12 sm:-left-7 sm:top-1 md:-left-9 md:top-2"
                            : "-right-15 sm:-right-6 sm:top-1 md:-right-8 md:top-2"
                        } lg:hidden`}
                        aria-hidden
                      >
                        <Image
                          src="/hero-signature-plate.webp"
                          alt=""
                          width={640}
                          height={640}
                          sizes="(max-width: 640px) 220px, (max-width: 768px) 260px, 280px"
                          className={FLOATING_PLATE_SHADOW}
                          priority
                        />
                      </div>

                      <div className="relative z-30 w-full">
                        <div className="flex flex-wrap gap-2">
                          <HeroChip label="Balanced Bites" />
                          <HeroChip label="By Dalia Seoudi" />
                        </div>

                        <h1 className="menu-serif mt-6 max-w-[11ch] text-[2.25rem] font-bold leading-[0.92] tracking-[-0.04em] text-[#426237] sm:text-[4.15rem] lg:text-[5.2rem]">
                          {locale === "ar" ? "أكل لكل البيت" : "Food for the Whole Family"}
                        </h1>

                        <p className="menu-script mt-3 text-[1.35rem] font-medium text-[#ac8058] sm:mt-4 sm:text-[2rem]">
                          {locale === "ar" ? "حياة صحية ببساطة" : "Healthy Living Made Simple"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 max-w-xl text-pretty text-[0.94rem] leading-7 text-[#426237]/75 sm:mt-6 sm:text-lg">
                      {locale === "ar"
                        ? "الأكل الصحي مش للدايت بس - ده لكل حد على السفرة. Balanced Bites بتعمل وجبات نضيفة ومشبعة تدعم نمو الأطفال، تساعد الكبار يفضلوا نشيطين، وتبني عادات صحية تعيش."
                        : "Eating healthy isn't just for diets-it's for everyone at the table. Balanced Bites makes clean, satisfying meals that support kids' growth, help adults stay energized, and build lifelong healthy habits."}
                    </p>

                    <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Link
                        href="/menu"
                        className="group inline-flex min-h-12 items-center justify-center rounded-full bg-[#426237] px-3 py-2 text-sm font-semibold text-white shadow-[0_20px_40px_-22px_rgba(66,98,55,0.65)] transition-[background-color,box-shadow,transform,color] duration-[220ms] ease-[var(--bb-ease-out)] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#2c4224] active:scale-[0.97]"
                      >
                        <span className="px-4">{locale === "ar" ? "شوف المنيو" : "Browse the menu"}</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/14 transition-transform duration-[220ms] ease-[var(--bb-ease-out)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-1 [@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-y-px rtl:[@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-x-1 rtl:[@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-0">
                          ↗
                        </span>
                      </Link>
                      <Link
                        href="/my-plan"
                        className="group inline-flex min-h-12 items-center justify-center rounded-full bg-white/80 px-3 py-2 text-sm font-semibold text-[#426237] ring-1 ring-[#426237]/12 transition-[background-color,box-shadow,transform,color,ring-color] duration-[220ms] ease-[var(--bb-ease-out)] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-white active:scale-[0.97]"
                      >
                        <span className="px-4">{locale === "ar" ? "اعمل خطتك" : "Get your plan"}</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#426237]/8 text-[#426237] transition-transform duration-[220ms] ease-[var(--bb-ease-out)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-1 [@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-y-px rtl:[@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-x-1 rtl:[@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-0">
                          →
                        </span>
                      </Link>
                    </div>
                  </div>

                  {/* Right — bento + floating plate (cutout sits above cards, bleeds past column on lg+) */}
                  <div className="relative overflow-visible lg:min-h-[320px]">
                    <div className="relative z-10 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2">
                      <div className="rounded-[1.5rem] bg-[#426237] p-1.5 shadow-[0_24px_50px_-30px_rgba(66,98,55,0.65)] ring-1 ring-[#426237]/10 sm:col-span-2 sm:rounded-[2rem]">
                        <div className="rounded-[calc(2rem-0.375rem)] bg-[linear-gradient(135deg,#4c6f3f_0%,#3a5630_100%)] px-5 py-5 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.14)]">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/65">
                                {locale === "ar" ? "تغذية للعيلة أولاً" : "Family-first nutrition"}
                              </p>
                              <p className="menu-serif mt-3 text-2xl font-bold leading-tight sm:text-[2rem]">
                                {locale === "ar" ? "مطبخ واحد." : "One kitchen."}
                                <br />
                                {locale === "ar" ? "منيو واحد." : "One menu."}
                              </p>
                            </div>
                            <div className="rounded-full bg-white/10 p-2.5 ring-1 ring-white/10">
                              <Image
                                src="/BB_By_Dalia-new white.png"
                                alt="Balanced Bites logo"
                                width={104}
                                height={32}
                                className="h-7 w-auto opacity-95"
                              />
                            </div>
                          </div>
                          <p className="mt-5 max-w-sm text-sm leading-6 text-white/75">
                            {locale === "ar"
                              ? "مفيش فصل بين أكل دايت وأكل عادي. بس وجبات نضيفة ومتوازنة كل البيت يستمتع بيها بجد."
                              : 'No split between "diet food" and "regular food". Just clean, balanced meals the whole family can genuinely enjoy.'}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[1.25rem] bg-white/80 p-1.5 shadow-[0_18px_45px_-30px_rgba(66,98,55,0.28)] ring-1 ring-[#426237]/10 sm:rounded-[1.75rem]">
                        <div className="rounded-[calc(1.25rem-0.375rem)] bg-white px-4 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.65)] sm:rounded-[calc(1.75rem-0.375rem)] sm:px-5 sm:py-5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ac8058]">
                            {locale === "ar" ? "الفوايد" : "Benefits"}
                          </p>
                          <div className="mt-4 space-y-3 text-sm text-[#426237]/78">
                            <p>{locale === "ar" ? "مناعة أقوى" : "Stronger immunity"}</p>
                            <p>{locale === "ar" ? "طاقة أحسن طول اليوم" : "Better day-long energy"}</p>
                            <p>{locale === "ar" ? "وزن صحي لكل الأعمار" : "Healthy weight for all ages"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[1.25rem] bg-[#efe8dc] p-1.5 shadow-[0_18px_45px_-30px_rgba(66,98,55,0.28)] ring-1 ring-[#426237]/10 sm:rounded-[1.75rem]">
                        <div className="rounded-[calc(1.25rem-0.375rem)] bg-[linear-gradient(180deg,#fffaf0_0%,#f3ebde_100%)] px-4 py-4 sm:rounded-[calc(1.75rem-0.375rem)] sm:px-5 sm:py-5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#426237]/70">
                            {locale === "ar" ? "أكل نضيف" : "Clean Eating"}
                          </p>
                          <p className="mt-4 text-sm leading-6 text-[#426237]/78">
                            {locale === "ar"
                              ? "مكونات حقيقية، دهون صحية، من غير سكر، من غير دقيق أبيض، ومن غير زيوت مصنعة."
                              : "Real ingredients, healthy fats, zero sugar, zero white flour, no processed oils."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/*
                      Hero plate (large viewports): same asset as mobile headline plate; absolute on bento column.
                    */}
                    <div
                      className={`${FLOATING_PLATE_SHELL} top-16 sm:top-20 ${FLOATING_PLATE_WIDTH_SALMON} lg:top-[21rem] ${
                        locale === "ar"
                          ? "hidden"
                          : "hidden -right-6 sm:-right-8 lg:-right-[6.75rem] lg:block"
                      }`}
                      aria-hidden
                    >
                      <Image
                        src="/hero-signature-plate.webp"
                        alt=""
                        width={800}
                        height={800}
                        sizes="(max-width: 1024px) 0px, 520px"
                        className={FLOATING_PLATE_SHADOW}
                        priority
                      />
                    </div>
                  </div>
                </div>
          </div>
        </section>

        {/* ──────────────── WHY CHOOSE HEALTHY EATING ──────────────── */}
        <section className="relative overflow-x-clip overflow-y-visible bg-gradient-to-b from-[#ebe4d9] via-[#ece6dc] to-[#ede9e2] px-3 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,0.9fr)] lg:items-stretch lg:gap-12">
              <ScrollReveal variant="slide-left">
                <div className="flex h-full flex-col justify-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ac8058]">
                    {locale === "ar" ? "ليه تختار الأكل الصحي؟" : "Why choose healthy eating?"}
                  </p>
                  <h2 className="menu-serif mt-4 max-w-[16ch] text-[2rem] font-bold leading-[1.08] tracking-tight text-[#426237] sm:text-[2.85rem]">
                    {locale === "ar" ? "أكل حقيقي، وكل يوم أحسن." : "Real food, better every day."}
                  </h2>
                  <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-[#426237]/70 sm:text-lg sm:leading-8">
                    {locale === "ar"
                      ? "استمتع بطاقة ثابتة، سكر دم أهدى، وزن صحي، ومناعة أقوى - من خلال أكل طبيعي وحقيقي."
                      : "Enjoy steady energy, balanced blood sugar, a healthy weight, and a stronger immune system - all by nourishing your body with real, natural food."}
                  </p>
                  <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                    {[
                      ...(locale === "ar"
                        ? ["طاقة ثابتة طول اليوم", "سكر دم متوازن", "وزن صحي طبيعي", "مناعة أقوى"]
                        : [
                            "Steady energy all day",
                            "Balanced blood sugar",
                            "Healthy weight, naturally",
                            "Stronger immunity",
                          ]),
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-sm font-medium text-[#426237]/80"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ac8058]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>

              <ScrollReveal variant="slide-right" delay={120}>
                <div className="h-full">
                  <div className="relative h-full overflow-hidden rounded-[2rem] bg-[#426237] p-1.5 shadow-[0_30px_70px_-34px_rgba(66,98,55,0.55)] ring-1 ring-[#426237]/15">
                    <div className="flex h-full flex-col rounded-[calc(2rem-0.375rem)] bg-[linear-gradient(135deg,#4c6f3f_0%,#3a5630_60%,#2f4628_100%)] px-7 py-8 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.14)] sm:px-9 sm:py-10">
                      <div
                        className="pointer-events-none absolute inset-0 opacity-25"
                        aria-hidden
                        style={{
                          backgroundImage:
                            "radial-gradient(circle at 85% 10%, rgba(212,184,150,0.35), transparent 45%), radial-gradient(circle at 10% 90%, rgba(255,255,255,0.1), transparent 45%)",
                        }}
                      />
                      <p className="relative text-[10px] font-semibold uppercase tracking-[0.24em] text-white/65">
                        {locale === "ar" ? "لايف ستايل أكل نضيف" : "Clean Eating Lifestyle"}
                      </p>
                      <h3 className="menu-serif relative mt-4 text-[1.65rem] font-bold leading-tight sm:text-[2rem]">
                        {locale === "ar" ? "من غير أبيض، من غير جلوتين، ومن غير تنازل عن الطعم." : "No whites, no gluten, no compromise."}
                      </h3>
                      <p className="relative mt-4 text-sm leading-7 text-white/75">
                        {locale === "ar"
                          ? "من غير سكر أبيض، من غير دقيق أبيض، ومن غير جلوتين - بس مكونات نضيفة وحقيقية."
                          : "No white sugar, no white flour, no gluten - just clean, real ingredients. Simple, honest food you can feel good about."}
                      </p>
                      <div className="relative mt-6 flex flex-wrap gap-2">
                        {(locale === "ar"
                          ? ["من غير سكر أبيض", "من غير دقيق أبيض", "من غير جلوتين"]
                          : ["No white sugar", "No white flour", "No gluten"]
                        ).map((label) => (
                          <span
                            key={label}
                            className="rounded-full bg-white/12 px-3.5 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/15"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                      <div className="relative mt-auto pt-8">
                        <Link
                          href="/menu"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-[#d4b896] transition-colors hover:text-white"
                        >
                          {locale === "ar" ? "شوف المنيو" : "Browse the menu"}
                          <span aria-hidden>→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ──────────────── WHAT WE BELIEVE ──────────────── */}
        <section className="relative overflow-x-clip overflow-y-visible bg-gradient-to-b from-[#ede9e2] to-[#f4f1eb] px-3 pb-8 pt-4 sm:px-8 sm:pb-10 sm:pt-5">
          <div className="mx-auto max-w-5xl">
            <ScrollReveal className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ac8058]">
                {t.home.whatBelieve}
              </p>
              <h2 className="menu-serif mx-auto mt-4 max-w-xl text-[1.65rem] font-bold leading-[1.1] tracking-tight text-[#426237] sm:text-[2.65rem]">
                {t.home.feelHome}
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-[#426237]/60">
                {t.home.feelHomeBody}
              </p>
            </ScrollReveal>

          </div>

          <div className="mx-auto mt-8 w-full max-w-5xl px-3 sm:mt-10 sm:px-8">
            <ScrollReveal variant="fade-up" delay={100}>
              <div
                className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
                aria-label={
                  locale === "ar"
                    ? "ليه بنؤمن بالأكل النضيف لكل البيت"
                    : "Reasons we believe in clean eating for the whole family"
                }
              >
                {t.home.benefits.map((card, index) => (
                    <article
                      key={card.title}
                      className="rounded-[1.25rem] bg-white/80 p-1.5 shadow-[0_18px_45px_-30px_rgba(66,98,55,0.28)] ring-1 ring-[#426237]/10 sm:rounded-[1.75rem]"
                    >
                      <div className="flex h-full flex-col rounded-[calc(1.25rem-0.375rem)] bg-white px-5 py-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.65)] sm:rounded-[calc(1.75rem-0.375rem)] sm:px-6 sm:py-6">
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#426237]/10 text-xs font-bold tabular-nums text-[#426237]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-end text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ac8058]">
                            {t.home.whyCleanEating}
                          </span>
                        </div>
                        <h3 className="menu-serif mt-4 text-lg font-bold leading-snug tracking-tight text-[#426237] sm:text-xl">
                          {card.title}
                        </h3>
                        <p className="mt-2 text-pretty text-sm leading-relaxed text-[#426237]/72 sm:text-[0.9375rem]">
                          {card.body}
                        </p>
                      </div>
                    </article>
                  ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ──────────── MARQUEE QUOTE ──────────── */}
        <ScrollReveal variant="fade">
          <section className="relative overflow-hidden bg-[#426237] py-8 sm:py-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              aria-hidden
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.12), transparent 35%), radial-gradient(circle at 80% 50%, rgba(172,128,88,0.14), transparent 35%)",
              }}
            />
            <div className="relative mx-auto flex max-w-6xl flex-row items-center gap-3 px-3 sm:gap-8 sm:px-8 lg:gap-12 lg:px-10">
              <div
                className={`pointer-events-none ${FLOATING_PLATE_WIDTH_BEEF}`}
                aria-hidden
              >
                <Image
                  src="/beef.webp"
                  alt=""
                  width={600}
                  height={600}
                  sizes="(max-width: 640px) 108px, (max-width: 768px) 200px, (max-width: 1024px) 240px, 280px"
                  className={FLOATING_PLATE_SHADOW}
                />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="menu-serif text-[clamp(1.05rem,3.6vw+0.35rem,2.75rem)] font-bold leading-[1.2] text-white sm:leading-snug">
                  &ldquo;{t.home.quote}
                  <br />
                  <span className="text-[#d4b896]">{t.home.quoteAccent}</span>&rdquo;
                </p>
                <p className="mt-3 text-xs leading-relaxed text-white/55 sm:mt-5 sm:text-sm">
                  {t.home.quoteBody}
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ──────────── APPROACH + INGREDIENTS ──────────── */}
        <section className="relative overflow-x-clip overflow-y-visible px-3 pb-14 pt-8 sm:px-8 sm:pb-28 sm:pt-12">
          <div className="mx-auto max-w-5xl">
            <div className="grid items-start gap-10 lg:grid-cols-[1fr_minmax(0,1.15fr)] lg:gap-16">
              <ScrollReveal variant="slide-left">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ac8058]">
                    {t.home.approach}
                  </p>
                  <h2 className="menu-serif mt-4 text-[2rem] font-bold tracking-tight text-[#426237] sm:text-[2.65rem]">
                    {t.home.hormoneTitle}
                  </h2>
                  <div className="mt-6 space-y-5 text-pretty text-base leading-7 text-[#426237]/75">
                    <p>
                      {t.home.hormoneP1}
                    </p>
                    <p>
                      {t.home.hormoneP2}
                    </p>
                    <p>
                      {t.home.hormoneP3}
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal variant="slide-right" delay={120}>
                <div className="rounded-[2rem] bg-white/60 p-1.5 shadow-[0_18px_48px_-24px_rgba(66,98,55,0.22)] ring-1 ring-[#426237]/8">
                  <div className="rounded-[calc(2rem-0.375rem)] bg-white px-6 py-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ac8058]">
                      {t.home.whatUse}
                    </p>
                    <h3 className="menu-serif mt-3 text-xl font-bold tracking-tight text-[#426237] sm:text-2xl">
                      {t.home.realIngredients}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#426237]/70">
                      {t.home.useIntro}
                    </p>

                    <div className="mt-6 border-t border-[#426237]/10 pt-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-500/80">
                        {t.home.never}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-[#426237]/72">
                        {(locale === "ar"
                          ? [
                              "دقيق أبيض",
                              "سكر",
                              "زيت عباد الشمس",
                              "زيت ذرة",
                              "زيوت مصنعة",
                              "مواد حافظة",
                              "مكونات غير طبيعية",
                            ]
                          : [
                              "White flour",
                              "Sugar",
                              "Sunflower oil",
                              "Corn oil",
                              "Processed oils",
                              "Preservatives",
                              "Unnatural ingredients",
                            ]
                        ).map((item) => (
                          <p key={item} className="flex items-center gap-2">
                            <span className="text-red-400/70">✕</span> {item}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 border-t border-[#426237]/10 pt-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#426237]/55">
                        {t.home.insteadUse}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(locale === "ar"
                          ? [
                              "دقيق لوز",
                              "دقيق جوز هند",
                              "ستيفيا",
                              "زبدة طبيعية",
                              "زبدة جوز هند",
                              "زيت زيتون بكر ممتاز",
                              "مُحلي مونك فروت",
                              "مُحلي إريثريتول",
                              "خضار طازة",
                              "لحمة وفراخ بلدي طازة",
                            ]
                          : [
                              "Almond flour",
                              "Coconut flour",
                              "Stevia",
                              "Natural butter",
                              "Coconut butter",
                              "Extra Virgin Olive Oil",
                              "Monk Fruit Sweetener",
                              "Erythritol Sweetener",
                              "Fresh Vegetables",
                              "Fresh Baladi Meat & Chicken",
                            ]
                        ).map((label, i) => (
                          <span
                            key={label}
                            className="bb-ingredient-chip rounded-full bg-[#426237] px-4 py-2 text-sm font-medium text-white shadow-[0_12px_28px_-20px_rgba(66,98,55,0.65)] ring-1 ring-[#426237]/15"
                            style={{ animationDelay: `${i * 120}ms` }}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>

          <div
            className={`${FLOATING_PLATE_SHELL} ${FLOATING_PLATE_WIDTH_LG} top-24 sm:top-20 lg:top-16 ${
              locale === "ar"
                ? "hidden"
                : "hidden -right-4 lg:right-[-8%] lg:block"
            }`}
            aria-hidden
          >
            <Image
              src="/grilled-chicken.webp"
              alt=""
              width={800}
              height={800}
              sizes="(max-width: 1024px) 0px, 380px"
              className={FLOATING_PLATE_SHADOW}
            />
          </div>
        </section>

        {/* ──────────── READY TO START + TIERS ──────────── */}
        <section className="relative overflow-x-clip overflow-y-visible px-3 pb-40 pt-6 sm:px-8 sm:pb-48 sm:pt-10 lg:pb-56">
          <div className="mx-auto max-w-6xl">
            <ScrollReveal className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ac8058]">
                {t.home.ready}
              </p>
              <h2 className="menu-serif mx-auto mt-4 max-w-[18ch] text-[2rem] font-bold leading-[1.08] tracking-tight text-[#426237] sm:text-[2.75rem]">
                {t.home.readyTitle}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#426237]/65">
                {t.home.readyBody}
              </p>
            </ScrollReveal>

            <div className="mt-14 grid gap-5 sm:gap-6 lg:grid-cols-3">
              {[
                {
                  tier: locale === "ar" ? "برونز" : "Bronze",
                  duration: locale === "ar" ? "شهر واحد" : "1 Month",
                  tagline: locale === "ar" ? "جرّب وحس بالفرق." : "Try it, feel the difference.",
                  accent: "bronze",
                  features:
                    locale === "ar"
                      ? [
                          "طبق أسبوعي متظبط على اختيارك",
                          "وجبة هدية كل أسبوع",
                          "وقف أو عدّي أي أسبوع",
                        ]
                      : [
                          "Fully customizable weekly plate",
                          "Free meal every week",
                          "Pause or skip any week",
                        ],
                } as const,
                {
                  tier: locale === "ar" ? "سيلفر" : "Silver",
                  duration: locale === "ar" ? "٣ شهور" : "3 Months",
                  tagline:
                    locale === "ar" ? "ابني عادات حقيقية تكمل معاك." : "Build real, lasting habits.",
                  accent: "silver",
                  featured: true,
                  features:
                    locale === "ar"
                      ? [
                          "كل حاجة في برونز",
                          "تجديدات موسمية للمنيو",
                          "أولوية في ميعاد الدليفري",
                          "متابعة مع أخصائية التغذية",
                        ]
                      : [
                          "Everything in Bronze",
                          "Seasonal menu refreshes",
                          "Priority delivery slot",
                          "Dietitian check-ins",
                        ],
                } as const,
                {
                  tier: locale === "ar" ? "جولد" : "Gold",
                  duration: locale === "ar" ? "٦ شهور" : "6 Months",
                  tagline:
                    locale === "ar" ? "استثمر بجد في صحتك." : "Go all-in on your health.",
                  accent: "gold",
                  features:
                    locale === "ar"
                      ? [
                          "كل حاجة في سيلفر",
                          "أهداف ماكروز مخصوصة ليك",
                          "تجربة وصفات جديدة قبل نزولها",
                          "مراجعة تغذية كل ٣ شهور",
                        ]
                      : [
                          "Everything in Silver",
                          "Personalized macro targets",
                          "Exclusive new-recipe previews",
                          "Quarterly nutrition reviews",
                        ],
                } as const,
              ].map((pkg, i) => {
                const isFeatured = "featured" in pkg && pkg.featured === true;
                const wrapClass = isFeatured
                  ? "bg-[#426237] ring-[#426237]/20 shadow-[0_30px_70px_-32px_rgba(66,98,55,0.6)] lg:-translate-y-4"
                  : "bg-white/80 ring-[#426237]/10 shadow-[0_24px_60px_-36px_rgba(66,98,55,0.32)]";
                const innerClass = isFeatured
                  ? "bg-[linear-gradient(135deg,#4c6f3f_0%,#3a5630_60%,#2e4325_100%)] text-white"
                  : "bg-[linear-gradient(180deg,#fffdf8_0%,#f8f4ec_100%)] text-[#426237]";
                const accentDot =
                  pkg.accent === "bronze"
                    ? "bg-[#b87333]"
                    : pkg.accent === "silver"
                      ? "bg-[#c0c0c0]"
                      : "bg-[#d4af37]";
                return (
                  <ScrollReveal key={pkg.tier} delay={i * 110} variant="fade-up">
                    <div
                      className={`relative h-full rounded-[2rem] p-1.5 ring-1 transition-[transform,box-shadow] duration-[240ms] ease-[var(--bb-ease-out)] ${wrapClass}`}
                    >
                      {isFeatured && (
                        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ac8058] px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-md">
                          {locale === "ar" ? "الأكثر طلبًا" : "Most popular"}
                        </span>
                      )}
                      <div
                        className={`flex h-full flex-col rounded-[calc(2rem-0.375rem)] px-7 py-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] sm:px-8 sm:py-10 ${innerClass}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`inline-block h-2.5 w-2.5 rounded-full ${accentDot}`}
                            aria-hidden
                          />
                          <p
                            className={`text-[10px] font-bold uppercase tracking-[0.22em] ${
                              isFeatured ? "text-white/70" : "text-[#426237]/60"
                            }`}
                          >
                            {pkg.duration}
                          </p>
                        </div>
                        <h3
                          className={`menu-serif mt-4 text-[2rem] font-bold leading-none tracking-tight sm:text-[2.25rem] ${
                            isFeatured ? "text-white" : "text-[#426237]"
                          }`}
                        >
                          {pkg.tier}
                        </h3>
                        <p
                          className={`mt-3 text-sm leading-6 ${
                            isFeatured ? "text-white/75" : "text-[#426237]/65"
                          }`}
                        >
                          {pkg.tagline}
                        </p>

                        <ul
                          className={`mt-7 space-y-3 text-sm ${
                            isFeatured ? "text-white/85" : "text-[#426237]/78"
                          }`}
                        >
                          {pkg.features.map((f) => (
                            <li key={f} className="flex items-start gap-2.5">
                              <span
                                className={`mt-[3px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                  isFeatured
                                    ? "bg-white/15 text-[#d4b896]"
                                    : "bg-[#426237]/10 text-[#426237]"
                                }`}
                                aria-hidden
                              >
                                ✓
                              </span>
                              {f}
                            </li>
                          ))}
                        </ul>

                        <div className="mt-auto pt-8">
                          <a
                            href={tierWhatsAppUrl(pkg.tier, pkg.duration, locale)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`group inline-flex w-full min-h-12 items-center justify-center rounded-full px-3 py-2 text-sm font-semibold transition-[background-color,box-shadow,transform,color] duration-[220ms] ease-[var(--bb-ease-out)] active:scale-[0.97] ${
                              isFeatured
                                ? "bg-white text-[#426237] shadow-[0_16px_34px_-20px_rgba(0,0,0,0.45)] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#fbf9f2]"
                                : "bg-[#426237] text-white shadow-[0_16px_34px_-20px_rgba(66,98,55,0.6)] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#2c4224]"
                            }`}
                          >
                            <span className="px-4">{t.home.chatWhatsapp}</span>
                            <span
                              className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-[220ms] ease-[var(--bb-ease-out)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-1 [@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-y-px rtl:[@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-x-1 rtl:[@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-0 ${
                                isFeatured ? "bg-[#426237]/10" : "bg-white/14"
                              }`}
                            >
                              ↗
                            </span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>

            <p className="mt-10 text-center text-xs text-[#426237]/55">
              {locale === "ar"
                ? "الخطط كلها قابلة للتخصيص - كلمنا على واتساب وهنظبطها على هدفك، حساسيتك، وجدولك."
                : "Plans are fully customizable - message us on WhatsApp and we'll tailor yours around goals, allergies, and schedule."}
            </p>
          </div>

          <div
            className={`pointer-events-none absolute z-10 max-w-none ${FLOATING_PLATE_WIDTH_TIERS_VEGAN} bottom-2 sm:bottom-4 lg:bottom-8 ${
              locale === "ar"
                ? "hidden"
                : "hidden -left-2 sm:-left-1 lg:left-[-2%] lg:block"
            }`}
            aria-hidden
          >
            <Image
              src="/vegan.webp"
              alt=""
              width={800}
              height={800}
              sizes="(max-width: 1024px) 0px, 248px"
              className={`${FLOATING_PLATE_SHADOW} mx-auto max-h-[200px] w-auto object-contain sm:max-h-[230px] lg:max-h-[248px]`}
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
