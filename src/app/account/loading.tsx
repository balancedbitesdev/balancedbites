"use client";

import Skeleton from "react-loading-skeleton";

export default function AccountLoading() {
  return (
    <div className="min-h-full bg-[#ebe6dc] font-sans text-[#426237]">
      <div className="border-b border-[#426237]/10 bg-[#f4f1eb]/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Skeleton width={144} height={36} borderRadius={10} className="leading-none sm:!h-9 sm:!w-36" />
          <div className="flex gap-2">
            <Skeleton circle width={48} height={48} className="leading-none sm:!h-11 sm:!w-11" />
            <Skeleton circle width={48} height={48} className="leading-none sm:!h-11 sm:!w-11" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-8 pt-5 sm:px-6 sm:pb-10 sm:pt-6">
        <div className="border-b border-[#426237]/15 pb-6">
          <Skeleton height={12} width={96} borderRadius={6} className="leading-none" />
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <Skeleton height={40} width={280} borderRadius={10} className="leading-none" />
              <Skeleton height={14} className="mt-3 max-w-md leading-none" borderRadius={6} />
              <Skeleton height={14} className="mt-2 max-w-sm leading-none" borderRadius={6} />
            </div>
            <Skeleton height={40} width={120} borderRadius={999} className="leading-none" />
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#426237]/12">
              <div className="border-b border-[#426237]/10 px-5 py-5">
                <div className="flex gap-3">
                  <Skeleton circle width={56} height={56} className="leading-none" />
                  <div className="min-w-0 flex-1 space-y-2 pt-1">
                    <Skeleton height={10} width={64} borderRadius={4} className="leading-none" />
                    <Skeleton height={18} width={140} borderRadius={6} className="leading-none" />
                    <Skeleton height={12} width={180} borderRadius={4} className="leading-none" />
                  </div>
                </div>
              </div>
              <div className="space-y-2 p-4">
                <Skeleton height={44} borderRadius={12} className="leading-none" />
                <Skeleton height={44} borderRadius={12} className="leading-none" />
              </div>
            </div>
            <div className="hidden rounded-2xl bg-white/90 p-2 ring-1 ring-[#426237]/10 lg:block">
              <Skeleton height={12} width={80} borderRadius={4} className="mx-3 my-2 leading-none" />
              <Skeleton height={40} borderRadius={12} className="mx-1 leading-none" />
              <Skeleton height={40} borderRadius={12} className="mx-1 leading-none" />
            </div>
          </div>

          <div className="min-w-0 space-y-6">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#426237]/12">
              <div className="border-b border-[#426237]/10 bg-[#faf9f6] px-5 py-4">
                <Skeleton height={16} width={72} borderRadius={6} className="leading-none" />
                <Skeleton height={12} width={200} borderRadius={4} className="mt-2 leading-none" />
              </div>
              <div className="px-5 py-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex justify-between gap-4 border-b border-[#426237]/8 py-3 last:border-0"
                  >
                    <Skeleton height={16} width={96} borderRadius={6} className="leading-none" />
                    <Skeleton height={16} width={88} borderRadius={6} className="leading-none" />
                    <Skeleton height={16} width={64} borderRadius={6} className="leading-none" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
