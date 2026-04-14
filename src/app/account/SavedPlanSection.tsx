"use client";

import { useEffect, useState } from "react";

const KEY = "bb_saved_plan_v1";

export type SavedPlanPayload = {
  savedAt: string;
  goal: string;
  activity: string;
  dietary: string;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

type Props = {
  /** `account` = dashboard-style metrics; `guest` = slightly softer explainer copy */
  variant?: "account" | "guest";
};

export function SavedPlanSection({ variant = "guest" }: Props) {
  const [raw, setRaw] = useState<string | null>(null);

  useEffect(() => {
    function read() {
      try {
        setRaw(window.localStorage.getItem(KEY));
      } catch {
        setRaw(null);
      }
    }
    read();
    window.addEventListener("bb-saved-plan", read);
    return () => window.removeEventListener("bb-saved-plan", read);
  }, []);

  let data: SavedPlanPayload | null = null;
  if (raw) {
    try {
      data = JSON.parse(raw) as SavedPlanPayload;
    } catch {
      data = null;
    }
  }

  if (data == null) {
    return (
      <div className="rounded-xl border border-dashed border-[#426237]/20 bg-[#faf9f6]/80 px-4 py-6 text-center">
        <p className="text-sm text-gray-600">
          No saved plan yet. Run the quiz on{" "}
          <a href="/my-plan" className="font-semibold text-[#426237] underline underline-offset-2">
            My Plan
          </a>{" "}
          and use &ldquo;Save to My Account&rdquo; on your results.
        </p>
      </div>
    );
  }

  const savedLabel = new Date(data.savedAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (variant === "account") {
    return (
      <div className="space-y-5">
        <p className="text-xs text-gray-500">
          Last updated{" "}
          <span className="font-medium tabular-nums text-gray-700">{savedLabel}</span>
        </p>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[#f4f1eb]/90 px-4 py-3 ring-1 ring-[#426237]/10">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Goal
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#426237]">{data.goal}</dd>
          </div>
          <div className="rounded-xl bg-[#f4f1eb]/90 px-4 py-3 ring-1 ring-[#426237]/10">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Activity
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#426237]">{data.activity}</dd>
          </div>
          <div className="rounded-xl bg-[#f4f1eb]/90 px-4 py-3 ring-1 ring-[#426237]/10 sm:col-span-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Diet
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#426237]">{data.dietary}</dd>
          </div>
        </dl>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Daily targets
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Calories", value: `${data.dailyCalories}`, unit: "kcal" },
              { label: "Protein", value: `${data.proteinG}`, unit: "g" },
              { label: "Carbs", value: `${data.carbsG}`, unit: "g" },
              { label: "Fat", value: `${data.fatG}`, unit: "g" },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl bg-white px-3 py-3 text-center ring-1 ring-[#426237]/10"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                  {m.label}
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-[#426237]">
                  {m.value}
                  <span className="text-xs font-semibold text-gray-500"> {m.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              window.localStorage.removeItem(KEY);
              setRaw(null);
            } catch {
              /* ignore */
            }
          }}
          className="text-sm font-semibold text-[#6b5b4d] underline-offset-2 transition-colors hover:text-[#426237] hover:underline"
        >
          Remove saved plan
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#f4f1eb]/80 p-5 ring-1 ring-[#426237]/10">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Saved {savedLabel}
      </p>
      <ul className="mt-3 space-y-1 text-sm text-gray-700">
        <li>
          <span className="font-medium text-[#426237]">Goal:</span> {data.goal}
        </li>
        <li>
          <span className="font-medium text-[#426237]">Activity:</span> {data.activity}
        </li>
        <li>
          <span className="font-medium text-[#426237]">Diet:</span> {data.dietary}
        </li>
        <li className="pt-2 font-semibold text-[#426237]">
          Targets: {data.dailyCalories} kcal · P {data.proteinG}g · C {data.carbsG}g · F {data.fatG}g
        </li>
      </ul>
      <button
        type="button"
        onClick={() => {
          try {
            window.localStorage.removeItem(KEY);
            setRaw(null);
          } catch {
            /* ignore */
          }
        }}
        className="mt-4 text-sm font-semibold text-[#6b5b4d] underline-offset-2 transition-colors hover:text-[#426237] hover:underline"
      >
        Remove saved plan
      </button>
    </div>
  );
}
