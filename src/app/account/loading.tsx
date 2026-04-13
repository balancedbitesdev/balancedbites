"use client";

import Skeleton from "react-loading-skeleton";

export default function AccountLoading() {
  return (
    <div className="min-h-full bg-[#f4f1eb] font-sans text-[#426237]">
      <div className="border-b border-[#426237]/10 bg-[#f4f1eb]/95">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Skeleton width={128} height={32} borderRadius={10} className="leading-none sm:!h-9 sm:!w-36" />
          <div className="flex gap-2">
            <Skeleton circle width={40} height={40} className="leading-none lg:!h-11 lg:!w-11" />
            <Skeleton circle width={40} height={40} className="leading-none lg:!h-11 lg:!w-11" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Skeleton height={40} width={192} borderRadius={10} className="leading-none" />
        <Skeleton height={16} className="mt-4 max-w-md leading-none" borderRadius={6} />
        <Skeleton height={16} className="mt-2 max-w-sm leading-none" borderRadius={6} />

        <div className="mt-10 space-y-6 rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-[#426237]/10">
          <Skeleton height={14} width={96} borderRadius={6} className="leading-none" />
          <Skeleton height={36} width={224} borderRadius={10} className="leading-none" />
          <Skeleton height={16} width={192} borderRadius={6} className="leading-none" />
          <div className="mt-6 flex flex-wrap gap-3">
            <Skeleton height={44} width={144} borderRadius={999} className="leading-none" />
            <Skeleton height={44} width={112} borderRadius={999} className="leading-none" />
          </div>
        </div>

        <div className="mt-8 space-y-4 rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-[#426237]/10">
          <Skeleton height={24} width={160} borderRadius={8} className="leading-none" />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex justify-between gap-4 border-b border-[#426237]/10 py-3 last:border-0"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton height={16} width={128} borderRadius={6} className="leading-none" />
                <Skeleton height={12} width={96} borderRadius={6} className="leading-none" />
              </div>
              <Skeleton height={16} width={64} borderRadius={6} className="leading-none" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
