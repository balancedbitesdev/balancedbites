import Link from "next/link";
import type { ReactNode } from "react";
import type { AccountDashboardData } from "@/lib/customer-account-data";

type Props = {
  data: AccountDashboardData;
  children?: ReactNode;
};

function formatWhen(iso: string | null): string {
  if (iso == null || iso === "") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AccountDashboard({ data, children }: Props) {
  const greeting = data.displayName ?? data.email ?? "there";
  const initial = (data.displayName ?? data.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)] lg:items-start">
      <aside className="space-y-4 lg:sticky lg:top-28">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#426237]/12">
          <div className="border-b border-[#426237]/10 bg-gradient-to-br from-[#faf9f6] to-white px-5 py-5">
            <div className="flex items-start gap-3">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#426237]/10 text-lg font-semibold text-[#426237] ring-2 ring-white shadow-sm"
                aria-hidden
              >
                {initial}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Signed in
                </p>
                <p className="truncate font-semibold leading-tight text-[#426237]">{greeting}</p>
                {data.email != null ? (
                  <p className="mt-1 truncate text-xs text-gray-500">{data.email}</p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 p-4">
            <Link
              href="/menu"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#426237] px-4 text-center text-sm font-semibold text-white shadow-[0_10px_28px_-16px_rgba(66,98,55,0.55)] transition-[background-color,box-shadow,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#2c4224] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.97]"
            >
              Order meals
            </Link>
            <a
              href="/api/customer-account/logout"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#426237]/20 bg-white px-4 text-center text-sm font-semibold text-[#426237] transition-[background-color,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f4f1eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.97]"
            >
              Log out
            </a>
          </div>
        </div>

        <nav
          className="hidden rounded-2xl bg-white/90 p-2 shadow-sm ring-1 ring-[#426237]/10 lg:block"
          aria-label="Account shortcuts"
        >
          <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Quick links
          </p>
          <Link
            href="/my-plan"
            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-[#426237] transition-colors hover:bg-[#f4f1eb]"
          >
            Meal plan quiz
          </Link>
          <Link
            href="/menu"
            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-[#426237] transition-colors hover:bg-[#f4f1eb]"
          >
            Browse menu
          </Link>
        </nav>
      </aside>

      <div className="min-w-0 space-y-6">
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#426237]/12">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#426237]/10 bg-[#faf9f6] px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#426237]/85">
                Orders
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">Recent purchases on this account</p>
            </div>
          </div>

          {data.orders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium text-[#426237]">No orders yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                When you check out from the menu, your receipts will appear in this table.
              </p>
              <Link
                href="/menu"
                className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full bg-[#426237]/10 px-6 text-sm font-semibold text-[#426237] transition-[background-color,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#426237]/15 active:scale-[0.97]"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[280px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#426237]/10 bg-white text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-3 font-medium">Order</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#426237]/8">
                  {data.orders.map((o) => (
                    <tr key={o.id} className="bg-white hover:bg-[#faf9f6]/80">
                      <td className="px-5 py-3.5 font-semibold text-[#426237]">
                        #{o.number}
                      </td>
                      <td className="px-5 py-3.5 tabular-nums text-gray-600">
                        {formatWhen(o.when)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-[#426237]">
                        {o.totalLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {children != null ? <div className="space-y-3">{children}</div> : null}
      </div>
    </div>
  );
}
