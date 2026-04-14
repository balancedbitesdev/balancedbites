import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";
import { ScrollReveal } from "@/components/balanced-bites/ScrollReveal";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Food for the whole family—balanced meals, clean keto, and natural ingredients. One kitchen, one menu, healthy for everyone.",
};

function HeroChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[#426237]/10 bg-white/85 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#426237]/75 shadow-[0_12px_30px_-18px_rgba(66,98,55,0.35)]">
      {label}
    </span>
  );
}

function FeatureIndex({ n }: { n: number }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#426237]/10 text-sm font-bold tabular-nums text-[#426237]">
      {String(n).padStart(2, "0")}
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
  "w-[min(92vw,400px)] sm:w-[min(94vw,450px)] lg:w-[520px]";

/** Hero salmon on phone/tablet: absolute top-right; larger than before, copy stays full width + higher z for readability. */
const FLOATING_PLATE_WIDTH_SALMON_MOBILE =
  "w-[min(54vw,220px)] sm:w-[min(50vw,260px)] md:w-[240px]";

/** Secondary floating plates (chicken, vegan). Same min-vw pattern, one step down from salmon. */
const FLOATING_PLATE_WIDTH_LG =
  "w-[min(88vw,300px)] sm:w-[340px] lg:w-[380px]";

/**
 * Marquee beef — in-flow beside quote. Tighter on phone so copy stays readable in one row.
 */
const FLOATING_PLATE_WIDTH_BEEF =
  "w-[min(30vw,108px)] shrink-0 sm:w-[200px] md:w-[240px] lg:w-[280px]";

export default function Home() {
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
                        className={`pointer-events-none absolute -right-15 -top-3 z-[70] ${FLOATING_PLATE_WIDTH_SALMON_MOBILE} sm:-right-6 sm:top-1 md:-right-8 md:top-2 lg:hidden`}
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

                      <div className="relative z-[60] w-full">
                        <div className="flex flex-wrap gap-2">
                          <HeroChip label="Balanced Bites" />
                          <HeroChip label="By Dalia Seoudi" />
                        </div>

                        <h1 className="menu-serif mt-6 max-w-[11ch] text-[2.25rem] font-bold leading-[0.92] tracking-[-0.04em] text-[#426237] sm:text-[4.15rem] lg:text-[5.2rem]">
                          Food for the Whole Family
                        </h1>

                        <p className="menu-script mt-3 text-[1.35rem] font-medium text-[#ac8058] sm:mt-4 sm:text-[2rem]">
                          Healthy Living Made Simple
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 max-w-xl text-pretty text-[0.94rem] leading-7 text-[#426237]/75 sm:mt-6 sm:text-lg">
                      Eating healthy isn&apos;t just for diets—it&apos;s for everyone at the table.
                      Balanced Bites makes clean, satisfying meals that support kids&apos; growth,
                      help adults stay energized, and build lifelong healthy habits.
                    </p>

                    <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Link
                        href="/menu"
                        className="group inline-flex min-h-12 items-center justify-center rounded-full bg-[#426237] px-3 py-2 text-sm font-semibold text-white shadow-[0_20px_40px_-22px_rgba(66,98,55,0.65)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#2c4224] active:scale-[0.98]"
                      >
                        <span className="px-4">Browse the menu</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/14 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px]">
                          ↗
                        </span>
                      </Link>
                      <Link
                        href="/my-plan"
                        className="group inline-flex min-h-12 items-center justify-center rounded-full bg-white/80 px-3 py-2 text-sm font-semibold text-[#426237] ring-1 ring-[#426237]/12 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white active:scale-[0.98]"
                      >
                        <span className="px-4">Get your plan</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#426237]/8 text-[#426237] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px]">
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
                                Family-first nutrition
                              </p>
                              <p className="menu-serif mt-3 text-2xl font-bold leading-tight sm:text-[2rem]">
                                One kitchen.
                                <br />
                                One menu.
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
                            No split between &ldquo;diet food&rdquo; and &ldquo;regular
                            food&rdquo;. Just clean, balanced meals the whole family can genuinely
                            enjoy.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[1.25rem] bg-white/80 p-1.5 shadow-[0_18px_45px_-30px_rgba(66,98,55,0.28)] ring-1 ring-[#426237]/10 sm:rounded-[1.75rem]">
                        <div className="rounded-[calc(1.25rem-0.375rem)] bg-white px-4 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.65)] sm:rounded-[calc(1.75rem-0.375rem)] sm:px-5 sm:py-5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ac8058]">
                            Benefits
                          </p>
                          <div className="mt-4 space-y-3 text-sm text-[#426237]/78">
                            <p>Stronger immunity</p>
                            <p>Better day-long energy</p>
                            <p>Healthy weight for all ages</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[1.25rem] bg-[#efe8dc] p-1.5 shadow-[0_18px_45px_-30px_rgba(66,98,55,0.28)] ring-1 ring-[#426237]/10 sm:rounded-[1.75rem]">
                        <div className="rounded-[calc(1.25rem-0.375rem)] bg-[linear-gradient(180deg,#fffaf0_0%,#f3ebde_100%)] px-4 py-4 sm:rounded-[calc(1.75rem-0.375rem)] sm:px-5 sm:py-5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#426237]/70">
                            Clean Keto
                          </p>
                          <p className="mt-4 text-sm leading-6 text-[#426237]/78">
                            Low carb, healthy fats, zero sugar, zero white flour, no processed oils.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/*
                      Hero plate (large viewports): same asset as mobile headline plate; absolute on bento column.
                    */}
                    <div
                      className={`${FLOATING_PLATE_SHELL} -right-6 top-16 hidden sm:-right-8 sm:top-20 ${FLOATING_PLATE_WIDTH_SALMON} lg:block lg:-right-[8.75rem] lg:top-80`}
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

        {/* ──────────────── WHAT WE BELIEVE ──────────────── */}
        <section className="relative overflow-x-clip overflow-y-visible bg-gradient-to-b from-[#ede9e2] to-[#f4f1eb] px-3 pb-16 pt-4 sm:px-8 sm:pb-28 sm:pt-5">
          <div className="mx-auto max-w-5xl">
            <ScrollReveal className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ac8058]">
                What we believe
              </p>
              <h2 className="menu-serif mx-auto mt-4 max-w-xl text-[1.65rem] font-bold leading-[1.1] tracking-tight text-[#426237] sm:text-[2.65rem]">
                Healthy eating should feel like home
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-[#426237]/60">
                Not restrictive, not complicated—just real food on the table that everyone reaches
                for.
              </p>
            </ScrollReveal>

            <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {[
                {
                  title: "Support kids\u2019 growth",
                  body: "Nutrient-dense meals with the vitamins and minerals growing bodies need every day.",
                },
                {
                  title: "Adults stay energized",
                  body: "Balanced macros that fuel you from morning to evening without the crash.",
                },
                {
                  title: "Long-term health",
                  body: "Clean ingredients that promote healthy weight and stronger immunity for every age.",
                },
                {
                  title: "Stable blood sugar",
                  body: "Low-glycemic recipes that keep your energy steady and your focus sharp.",
                },
                {
                  title: "One menu for all",
                  body: "No separate \u201Cdiet meals\u201D and \u201Cregular meals.\u201D Everyone eats the same delicious food.",
                },
                {
                  title: "Lifelong habits",
                  body: "When the whole family eats well together, healthy choices become second nature.",
                },
              ].map((card, i) => (
                <ScrollReveal key={card.title} delay={i * 90} variant="fade-up">
                  <div className="group h-full rounded-[2rem] bg-white/60 p-1.5 shadow-[0_16px_48px_-20px_rgba(66,98,55,0.18)] ring-1 ring-[#426237]/8 transition-shadow duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_24px_60px_-20px_rgba(66,98,55,0.3)]">
                    <div className="flex h-full flex-col rounded-[calc(2rem-0.375rem)] bg-white px-6 py-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
                      <FeatureIndex n={i + 1} />
                      <h3 className="menu-serif mt-4 text-lg font-bold leading-snug text-[#426237]">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#426237]/65">{card.body}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
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
                  &ldquo;One kitchen. One menu.
                  <br />
                  <span className="text-[#d4b896]">Healthy for everyone.</span>&rdquo;
                </p>
                <p className="mt-3 text-xs leading-relaxed text-white/55 sm:mt-5 sm:text-sm">
                  The idea behind everything we cook.
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ──────────── CLEAN KETO ──────────── */}
        <section className="relative overflow-x-clip overflow-y-visible px-3 pb-14 pt-8 sm:px-8 sm:pb-28 sm:pt-12">
          <div className="mx-auto max-w-5xl">
            <div className="grid items-start gap-10 lg:grid-cols-[1fr_minmax(0,1.15fr)] lg:gap-16">
              <ScrollReveal variant="slide-left">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ac8058]">
                    Our approach
                  </p>
                  <h2 className="menu-serif mt-4 text-[2rem] font-bold tracking-tight text-[#426237] sm:text-[2.65rem]">
                    Clean Keto
                  </h2>
                  <p className="mt-4 text-pretty text-base leading-7 text-[#426237]/70">
                    Keto (ketogenic) is a low-carb, high-fat way of eating that trains your body to
                    burn fat instead of carbs for energy. We take it further with a{" "}
                    <strong className="text-[#426237]">clean</strong> approach: only real, natural
                    ingredients.
                  </p>

                  <div className="mt-8 space-y-5">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-[#426237]/80">
                        How it works
                      </h3>
                      <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-[#426237]/68">
                        <li className="flex items-start gap-2.5">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ac8058]" />
                          Reduce carbs (bread, rice, sugar)
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ac8058]" />
                          Increase healthy fats (avocado, nuts, natural butter)
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ac8058]" />
                          Enter ketosis — your body burns fat for fuel
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-[#426237]/80">
                        Goals
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {["Weight loss", "Better energy", "Stable blood sugar"].map((g) => (
                          <span
                            key={g}
                            className="rounded-full bg-[#426237]/8 px-4 py-2 text-sm font-medium text-[#426237]/80"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 rounded-[1.5rem] border border-[#ac8058]/25 bg-gradient-to-b from-white to-[#faf8f4] px-5 py-4 shadow-sm">
                    <p className="text-sm font-medium text-[#426237]">
                      In short:{" "}
                      <span className="font-semibold text-[#ac8058]">Clean Keto</span> = burn fat +
                      eat clean, natural ingredients only.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal variant="slide-right" delay={120}>
                <div className="space-y-5">
                  <div className="rounded-[2rem] bg-white/60 p-1.5 shadow-[0_18px_48px_-24px_rgba(66,98,55,0.22)] ring-1 ring-[#426237]/8">
                    <div className="rounded-[calc(2rem-0.375rem)] bg-white px-6 py-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-red-400/80">
                        What we never use
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-[#426237]/72">
                        {[
                          "White flour",
                          "Sugar",
                          "Sunflower oil",
                          "Corn oil",
                          "Processed oils",
                          "Preservatives",
                          "Unnatural ingredients",
                        ].map((item) => (
                          <p key={item} className="flex items-center gap-2">
                            <span className="text-red-400/60">✕</span> {item}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[2rem] bg-[#426237] p-1.5 shadow-[0_18px_48px_-24px_rgba(66,98,55,0.45)] ring-1 ring-[#426237]/10">
                    <div className="rounded-[calc(2rem-0.375rem)] bg-[linear-gradient(135deg,#4c6f3f_0%,#3a5630_100%)] px-6 py-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.14)]">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
                        What we use instead
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {[
                          "Almond flour",
                          "Coconut flour",
                          "Stevia",
                          "Natural butter",
                          "Coconut butter",
                        ].map((label) => (
                          <span
                            key={label}
                            className="rounded-full bg-white/12 px-4 py-2 text-sm font-medium text-white/85 ring-1 ring-white/10"
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
            className={`${FLOATING_PLATE_SHELL} ${FLOATING_PLATE_WIDTH_LG} -right-4 top-24 hidden sm:top-20 lg:right-[-8%] lg:top-16 lg:block`}
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

        {/* ──────────── CTA BAND ──────────── */}
        <ScrollReveal variant="scale">
          <section className="relative overflow-x-clip overflow-y-visible px-3 pb-16 sm:px-8 sm:pb-28">
            <div className="mx-auto max-w-4xl">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-[#f8f4ed] p-2 shadow-[0_30px_80px_-40px_rgba(66,98,55,0.3)] ring-1 ring-[#426237]/10 sm:p-3">
                <div className="relative overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-[linear-gradient(135deg,#fffdf8_0%,#f7f2e8_45%,#f3eee4_100%)] px-6 py-12 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.65)] sm:px-10 sm:py-16">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-50"
                    aria-hidden
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 30% 40%, rgba(66,98,55,0.08), transparent 30%), radial-gradient(circle at 70% 60%, rgba(172,128,88,0.1), transparent 30%)",
                    }}
                  />
                  <div className="relative">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ac8058]">
                      Ready to start?
                    </p>
                    <h2 className="menu-serif mt-4 text-[2rem] font-bold tracking-tight text-[#426237] sm:text-[2.65rem]">
                      Your family&apos;s healthier table starts here
                    </h2>
                    <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#426237]/60">
                      Explore the menu, build your weekly plan, or learn more about our clean keto
                      approach.
                    </p>
                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                      <Link
                        href="/menu"
                        className="group inline-flex min-h-12 items-center justify-center rounded-full bg-[#426237] px-3 py-2 text-sm font-semibold text-white shadow-[0_20px_40px_-22px_rgba(66,98,55,0.65)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#2c4224] active:scale-[0.98]"
                      >
                        <span className="px-4">See the full menu</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/14 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px]">
                          ↗
                        </span>
                      </Link>
                      <Link
                        href="/learn"
                        className="inline-flex min-h-12 items-center justify-center rounded-full bg-white/80 px-7 py-2 text-sm font-semibold text-[#426237] ring-1 ring-[#426237]/12 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white active:scale-[0.98]"
                      >
                        Learn more
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`${FLOATING_PLATE_SHELL} ${FLOATING_PLATE_WIDTH_LG} -left-4 bottom-8 hidden sm:bottom-12 lg:left-[-4%] lg:bottom-16 lg:block`}
              aria-hidden
            >
              <Image
                src="/vegan.webp"
                alt=""
                width={800}
                height={800}
                sizes="(max-width: 1024px) 0px, 380px"
                className={FLOATING_PLATE_SHADOW}
              />
            </div>
          </section>
        </ScrollReveal>
      </main>

      <SiteFooter />
    </div>
  );
}
