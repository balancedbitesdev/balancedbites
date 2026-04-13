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

export function SavedPlanSection() {
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
      <p className="text-sm text-gray-600">
        No saved plan yet. Complete the quiz on{" "}
        <a href="/my-plan" className="font-semibold text-[#426237] underline">
          My Plan
        </a>{" "}
        and tap &ldquo;Save to My Account&rdquo; on your results screen.
      </p>
    );
  }

  return (
    <div className="rounded-2xl bg-[#f4f1eb]/80 p-5 ring-1 ring-[#426237]/10">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Saved {new Date(data.savedAt).toLocaleString()}
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
        className="mt-4 text-sm font-semibold text-red-700 underline-offset-2 hover:underline"
      >
        Clear saved plan
      </button>
    </div>
  );
}
