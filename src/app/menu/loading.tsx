"use client";

import Skeleton from "react-loading-skeleton";

export default function MenuLoading() {
  return (
    <div className="min-h-full bg-[#f4f1eb] font-sans text-[#426237]">
      <div className="border-b border-[#426237]/10 bg-[#f4f1eb]/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Skeleton width={144} height={36} borderRadius={10} className="leading-none sm:!h-9 sm:!w-36" />
          <div className="hidden gap-6 sm:flex">
            <Skeleton width={56} height={16} borderRadius={6} className="leading-none" />
            <Skeleton width={56} height={16} borderRadius={6} className="leading-none" />
            <Skeleton width={56} height={16} borderRadius={6} className="leading-none" />
          </div>
          <div className="flex gap-2">
            <Skeleton circle width={48} height={48} className="leading-none sm:!h-11 sm:!w-11" />
            <Skeleton circle width={48} height={48} className="leading-none sm:!h-11 sm:!w-11" />
          </div>
        </div>
      </div>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-16">
          <Skeleton width={160} height={24} borderRadius={999} className="leading-none" />
          <Skeleton height={44} className="mt-5 max-w-md leading-none sm:!h-12" borderRadius={12} />
          <Skeleton height={16} className="mt-4 max-w-xl leading-none" borderRadius={6} />
          <Skeleton height={16} className="mt-2 max-w-lg leading-none" borderRadius={6} />
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <Skeleton height={96} borderRadius={16} className="mb-8 leading-none" />
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} width={96} height={40} borderRadius={999} className="leading-none" />
            ))}
          </div>
          <ul className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <li
                key={i}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#426237]/8"
              >
                <Skeleton
                  height={200}
                  className="!block w-full leading-none"
                  borderRadius={0}
                  containerClassName="block leading-none"
                />
                <div className="space-y-3 px-6 py-5">
                  <Skeleton height={20} width="72%" borderRadius={8} className="leading-none" />
                  <Skeleton height={14} className="leading-none" borderRadius={6} />
                  <Skeleton height={14} width="88%" borderRadius={6} className="leading-none" />
                  <div className="mt-4 flex justify-between gap-4 pt-4">
                    <Skeleton width={64} height={28} borderRadius={8} className="leading-none" />
                    <Skeleton width={112} height={44} borderRadius={999} className="leading-none" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
