import Link from "next/link";
import type { AccountDashboardData } from "@/lib/customer-account-data";

type Props = {
  data: AccountDashboardData;
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

export function AccountDashboard({ data }: Props) {
  const greeting = data.displayName ?? data.email ?? "there";

  return (
    <div className="space-y-10">
      <section className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-[#426237]/10">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Dashboard</p>
        <h2 className="menu-serif mt-2 text-2xl font-semibold text-[#426237]">
          Hello, {greeting}
        </h2>
        {data.email != null ? (
          <p className="mt-2 text-sm text-gray-600">{data.email}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/menu"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#426237] px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2c4224]"
          >
            Order meals
          </Link>
          <a
            href="/api/customer-account/logout"
            className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#426237]/25 bg-white px-8 py-3 text-sm font-semibold text-[#426237] transition-colors hover:bg-[#f4f1eb]"
          >
            Log out
          </a>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-[#426237]/10">
        <h3 className="text-lg font-semibold text-[#426237]">Recent orders</h3>
        {data.orders.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">
            No orders yet. When you place one, it will show up here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[#426237]/10">
            {data.orders.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-[#426237]">Order #{o.number}</p>
                  <p className="text-xs text-gray-500">{formatWhen(o.when)}</p>
                </div>
                <p className="font-medium tabular-nums text-[#426237]">{o.totalLabel}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
