"use client";

import Skeleton from "react-loading-skeleton";

/** Fallback when a route has no segment-level `loading.tsx` — keeps navigations feeling responsive. */
export default function AppLoading() {
  return (
    <div className="min-h-[40vh] bg-[#f4f1eb] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Skeleton height={36} width="42%" borderRadius={10} className="leading-none" />
        <Skeleton count={2} height={14} className="mt-4 leading-none" borderRadius={6} />
        <Skeleton height={200} borderRadius={24} className="mt-10 leading-none" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Skeleton height={120} borderRadius={20} className="leading-none" />
          <Skeleton height={120} borderRadius={20} className="leading-none" />
        </div>
      </div>
    </div>
  );
}
