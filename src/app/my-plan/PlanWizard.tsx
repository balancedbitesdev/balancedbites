"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  activityLabel,
  computePlanTargets,
  dietaryLabel,
  goalLabel,
  scoreProductForDiet,
  type ActivityId,
  type DietaryId,
  type GenderId,
  type GoalId,
} from "@/lib/nutrition-plan";
import type { PlanProductCard } from "./plan-types";

const TOTAL_STEPS = 5;
const SAVED_PLAN_KEY = "bb_saved_plan_v1";

const STEP_COPY = [
  {
    script: "First things first",
    title: "What is your goal?",
    subtitle:
      "We will tune calories and macros so every recommendation fits what you are working toward.",
  },
  {
    script: "Move with intention",
    title: "How active is your typical week?",
    subtitle:
      "Activity changes how much energy you burn—we use this to keep targets realistic, not restrictive.",
  },
  {
    script: "Eat your way",
    title: "Preferred eating style",
    subtitle:
      "Pick the pattern that matches your kitchen and lifestyle. You can change it whenever you like.",
  },
  {
    script: "Almost there!",
    title: "Tell us about you",
    subtitle:
      "We use these clinical metrics to calibrate your macro-nutrient targets with scientific precision.",
  },
  {
    script: "Ready when you are",
    title: "Review your profile",
    subtitle:
      "Confirm your details. When you continue, we will generate daily targets and menu picks for you.",
  },
] as const;

type Props = {
  products: PlanProductCard[];
};

const GOALS: { id: GoalId; label: string; hint: string }[] = [
  { id: "lose", label: "Lose weight", hint: "Moderate deficit, protein-forward" },
  { id: "maintain", label: "Maintain", hint: "Steady energy, stable weight" },
  { id: "gain", label: "Build lean mass", hint: "Controlled surplus, training-friendly" },
];

const ACTIVITIES: { id: ActivityId; label: string }[] = [
  { id: "sedentary", label: "Sedentary" },
  { id: "light", label: "Light" },
  { id: "moderate", label: "Moderate" },
  { id: "active", label: "Active" },
  { id: "very_active", label: "Very active" },
];

const DIETS: { id: DietaryId; label: string }[] = [
  { id: "keto", label: "Keto" },
  { id: "low_carb", label: "Low carb" },
  { id: "balanced", label: "Balanced" },
  { id: "high_protein", label: "High protein" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "mediterranean", label: "Mediterranean" },
];

export function PlanWizard({ products }: Props) {
  const [step, setStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [goal, setGoal] = useState<GoalId | null>(null);
  const [activity, setActivity] = useState<ActivityId | null>(null);
  const [dietary, setDietary] = useState<DietaryId | null>(null);
  const [age, setAge] = useState("25");
  const [gender, setGender] = useState<GenderId>("female");
  const [heightCm, setHeightCm] = useState("175");
  const [weightKg, setWeightKg] = useState("68");

  const progressPct = showResults
    ? 100
    : Math.round((step / TOTAL_STEPS) * 100);

  const parsed = useMemo(() => {
    const ageN = Number.parseInt(age, 10);
    const h = Number.parseFloat(heightCm);
    const w = Number.parseFloat(weightKg);
    const ok =
      Number.isFinite(ageN) &&
      ageN > 10 &&
      ageN < 120 &&
      Number.isFinite(h) &&
      h > 100 &&
      h < 250 &&
      Number.isFinite(w) &&
      w > 25 &&
      w < 300;
    return { ageN, h, w, ok };
  }, [age, heightCm, weightKg]);

  const canAdvance = useMemo(() => {
    switch (step) {
      case 1:
        return goal != null;
      case 2:
        return activity != null;
      case 3:
        return dietary != null;
      case 4:
        return parsed.ok;
      case 5:
        return goal != null && activity != null && dietary != null && parsed.ok;
      default:
        return false;
    }
  }, [step, goal, activity, dietary, parsed.ok]);

  const plan = useMemo(() => {
    if (
      !showResults ||
      goal == null ||
      activity == null ||
      dietary == null ||
      !parsed.ok
    ) {
      return null;
    }
    return computePlanTargets(
      parsed.w,
      parsed.h,
      parsed.ageN,
      gender,
      activity,
      goal,
      dietary,
    );
  }, [showResults, goal, activity, dietary, gender, parsed, parsed.ok]);

  const picks = useMemo(() => {
    if (!showResults || dietary == null) return [];
    const scored = products.map((p) => {
      const blob = `${p.title} ${p.descriptionPlain} ${p.productType} ${p.tags.join(" ")}`;
      return { p, score: scoreProductForDiet(blob, dietary) };
    });
    scored.sort((a, b) => b.score - a.score || a.p.title.localeCompare(b.p.title));
    const out: PlanProductCard[] = [];
    const seen = new Set<string>();
    for (const { p } of scored) {
      if (out.length >= 6) break;
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
    }
    if (out.length < 6) {
      for (const p of products) {
        if (out.length >= 6) break;
        if (!seen.has(p.id)) {
          seen.add(p.id);
          out.push(p);
        }
      }
    }
    return out.slice(0, 6);
  }, [showResults, dietary, products]);

  function next() {
    if (!canAdvance) return;
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      setShowResults(true);
    }
  }

  function back() {
    if (showResults) {
      setShowResults(false);
      setStep(TOTAL_STEPS);
      return;
    }
    if (step > 1) setStep((s) => s - 1);
  }

  const meta = STEP_COPY[step - 1];

  if (showResults && plan != null && goal != null && activity != null && dietary != null) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <div className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-[#426237]/10 sm:p-12">
          <p className="menu-script text-lg text-[#426237] sm:text-xl">
            Your personalized plan
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#426237] sm:text-4xl">
            Built around you
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-gray-600">
            Based on your goal ({goalLabel(goal)}), activity ({activityLabel(activity)}), and{" "}
            {dietaryLabel(dietary)} preferences, here is a daily calorie target with macro ranges
            aligned to evidence-based formulas (Mifflin–St Jeor plus activity factor). Use this as a
            compass—not a prescription—and adjust with your clinician if you have medical needs.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Calories" value={`${plan.dailyCalories}`} unit="kcal" />
            <Stat label="Protein" value={`${plan.proteinG}`} unit="g" />
            <Stat label="Carbs" value={`${plan.carbsG}`} unit="g" />
            <Stat label="Fat" value={`${plan.fatG}`} unit="g" />
          </div>

          <p className="mt-6 text-xs text-gray-500">
            Estimated BMR {plan.bmr} kcal · maintenance estimate {plan.tdee} kcal before goal
            adjustment.
          </p>

          <h2 className="mt-12 text-lg font-semibold text-[#426237]">
            Recommended from our menu
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Picks ranked for your eating style. Add what you love at checkout.
          </p>

          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {picks.map((p) => (
              <li
                key={p.id}
                className="flex gap-3 rounded-2xl border border-[#426237]/10 bg-[#f4f1eb]/40 p-3"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f4f1eb]">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.imageAlt}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#426237]">{p.title}</p>
                  <p className="text-sm font-medium text-[#ac8058]">{p.priceLabel}</p>
                  <Link
                    href="/menu"
                    className="mt-1 inline-block text-xs font-semibold text-[#426237] underline decoration-[#426237]/30 underline-offset-2"
                  >
                    View on menu
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => {
                try {
                  const payload = {
                    savedAt: new Date().toISOString(),
                    goal: goalLabel(goal),
                    activity: activityLabel(activity),
                    dietary: dietaryLabel(dietary),
                    dailyCalories: plan.dailyCalories,
                    proteinG: plan.proteinG,
                    carbsG: plan.carbsG,
                    fatG: plan.fatG,
                  };
                  window.localStorage.setItem(
                    SAVED_PLAN_KEY,
                    JSON.stringify(payload),
                  );
                  window.dispatchEvent(new Event("bb-saved-plan"));
                  setSaveMessage(
                    "Saved to this device. View or update it under My Account → Saved plans.",
                  );
                } catch {
                  setSaveMessage("Could not save on this device.");
                }
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#426237] bg-white px-8 py-3 text-sm font-semibold text-[#426237] transition-colors hover:bg-[#f4f1eb]"
            >
              Save to My Account
            </button>
            {saveMessage != null ? (
              <p
                className={`text-sm ${saveMessage.startsWith("Could not") ? "text-red-800" : "text-green-800"}`}
                role="status"
              >
                {saveMessage}
              </p>
            ) : null}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setShowResults(false);
                setStep(1);
                setSaveMessage(null);
              }}
              className="text-sm font-semibold text-gray-600 underline decoration-gray-300 underline-offset-4 transition-colors hover:text-[#426237]"
            >
              Start over
            </button>
            <Link
              href="/menu"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#426237] px-10 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#2c4224] active:scale-[0.98]"
            >
              Start Your Weekly Plan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 pt-8 sm:px-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-[#426237]/10 sm:p-12">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 text-xs font-medium text-gray-500">
            <span>
              Step {step} of {TOTAL_STEPS}
            </span>
            <span>{progressPct}% Complete</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-[#426237] transition-[width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <p className="menu-script text-lg text-[#426237] sm:text-xl">{meta.script}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#426237] sm:text-4xl">
          {meta.title}
        </h1>
        <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-gray-600">
          {meta.subtitle}
        </p>

        <div className="mt-10 space-y-8">
          {step === 1 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  className={`rounded-2xl border px-4 py-4 text-left transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    goal === g.id
                      ? "border-[#426237] bg-[#426237] text-white shadow-sm"
                      : "border-[#426237]/15 bg-[#f4f1eb]/50 text-[#426237] hover:border-[#426237]/40"
                  }`}
                >
                  <span className="block text-sm font-bold">{g.label}</span>
                  <span
                    className={`mt-1 block text-xs ${goal === g.id ? "text-white/85" : "text-gray-600"}`}
                  >
                    {g.hint}
                  </span>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {ACTIVITIES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setActivity(a.id)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    activity === a.id
                      ? "border-[#426237] bg-[#426237] text-white"
                      : "border-transparent bg-[#f4f1eb] text-[#426237] hover:bg-[#f4f1eb]/80"
                  }`}
                >
                  <span className="block">{a.label}</span>
                  <span
                    className={`mt-0.5 block text-xs font-normal ${activity === a.id ? "text-white/85" : "text-gray-600"}`}
                  >
                    {activityLabel(a.id)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-wrap gap-2">
              {DIETS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDietary(d.id)}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    dietary === d.id
                      ? "bg-[#426237] text-white shadow-sm"
                      : "bg-[#f4f1eb] text-[#426237] ring-1 ring-[#426237]/10 hover:bg-[#f4f1eb]/80"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <label className="block">
                <span className="text-sm font-semibold text-[#426237]">Your Age</span>
                <div className="mt-2 flex items-center gap-3 rounded-xl bg-[#f4f1eb] px-4 py-3 ring-1 ring-[#426237]/10 focus-within:ring-2 focus-within:ring-[#426237]/30">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={12}
                    max={110}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent text-[#426237] outline-none placeholder:text-gray-400"
                    placeholder="25"
                  />
                  <span className="shrink-0 text-sm text-gray-500">Years</span>
                </div>
              </label>

              <div>
                <span className="text-sm font-semibold text-[#426237]">Gender Identity</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      ["male", "Male"],
                      ["female", "Female"],
                      ["other", "Other"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setGender(id)}
                      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                        gender === id
                          ? "bg-[#426237] text-white"
                          : "bg-[#f4f1eb] text-[#426237] ring-1 ring-[#426237]/10"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-[#426237]">Current Height</span>
                <div className="mt-2 flex items-center gap-3 rounded-xl bg-[#f4f1eb] px-4 py-3 ring-1 ring-[#426237]/10 focus-within:ring-2 focus-within:ring-[#426237]/30">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={120}
                    max={230}
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent text-[#426237] outline-none placeholder:text-gray-400"
                    placeholder="175"
                  />
                  <span className="shrink-0 text-sm text-gray-500">cm</span>
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[#426237]">Body Weight</span>
                <div className="mt-2 flex items-center gap-3 rounded-xl bg-[#f4f1eb] px-4 py-3 ring-1 ring-[#426237]/10 focus-within:ring-2 focus-within:ring-[#426237]/30">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={35}
                    max={250}
                    step={0.1}
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent text-[#426237] outline-none placeholder:text-gray-400"
                    placeholder="68"
                  />
                  <span className="shrink-0 text-sm text-gray-500">kg</span>
                </div>
              </label>

              <div className="flex flex-col gap-4 rounded-2xl bg-[#f4f1eb] p-5 ring-1 ring-[#426237]/10 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-sm italic leading-relaxed text-gray-700">
                    &ldquo;Precision nutrition starts with accurate bio-metrics. This ensures your meal
                    portions are perfectly balanced for your metabolic rate.&rdquo;
                  </p>
                  <p className="mt-3 text-xs font-semibold text-[#426237]">
                    — Dr. Julian Thorne, Lead Nutritionist
                  </p>
                </div>
                <div className="relative mx-auto h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm sm:mx-0">
                  <Image
                    src="https://picsum.photos/seed/bb-nutritionist/160/160"
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 5 && goal && activity && dietary && (
            <ul className="space-y-3 rounded-2xl bg-[#f4f1eb]/50 p-5 text-sm ring-1 ring-[#426237]/10">
              <li className="flex justify-between gap-4 border-b border-[#426237]/10 pb-2">
                <span className="text-gray-600">Goal</span>
                <span className="font-semibold text-[#426237]">{goalLabel(goal)}</span>
              </li>
              <li className="flex justify-between gap-4 border-b border-[#426237]/10 pb-2">
                <span className="text-gray-600">Activity</span>
                <span className="text-right font-semibold text-[#426237]">
                  {activityLabel(activity)}
                </span>
              </li>
              <li className="flex justify-between gap-4 border-b border-[#426237]/10 pb-2">
                <span className="text-gray-600">Diet style</span>
                <span className="font-semibold text-[#426237]">{dietaryLabel(dietary)}</span>
              </li>
              <li className="flex justify-between gap-4 border-b border-[#426237]/10 pb-2">
                <span className="text-gray-600">Age / Gender</span>
                <span className="font-semibold text-[#426237]">
                  {parsed.ok ? `${parsed.ageN} yrs` : "—"} ·{" "}
                  {gender === "male" ? "Male" : gender === "female" ? "Female" : "Other"}
                </span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-gray-600">Height / Weight</span>
                <span className="font-semibold text-[#426237]">
                  {parsed.ok ? `${parsed.h} cm · ${parsed.w} kg` : "—"}
                </span>
              </li>
            </ul>
          )}
        </div>

        <div className="mt-12 flex flex-col-reverse gap-4 border-t border-[#426237]/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={back}
              className="text-sm font-semibold text-gray-600 transition-colors hover:text-[#426237]"
            >
              ← Back
            </button>
          ) : (
            <Link
              href="/"
              className="text-sm font-semibold text-gray-600 transition-colors hover:text-[#426237]"
            >
              ← Back
            </Link>
          )}
          <button
            type="button"
            disabled={!canAdvance}
            onClick={next}
            className="min-h-11 rounded-full bg-[#426237] px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#2c4224] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 active:scale-[0.98]"
          >
            {step === TOTAL_STEPS ? "Generate my plan" : "Next Step →"}
          </button>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#426237] shadow-sm ring-1 ring-[#426237]/10">
          <LockIcon className="h-3.5 w-3.5 text-[#426237]" aria-hidden />
          Scientifically validated calculations
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl bg-[#f4f1eb] px-3 py-3 ring-1 ring-[#426237]/10">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-[#426237]">
        {value}
        <span className="ml-0.5 text-xs font-semibold text-gray-500">{unit}</span>
      </p>
    </div>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 11V8a5 5 0 0110 0v3M6 11h12v10H6V11z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
