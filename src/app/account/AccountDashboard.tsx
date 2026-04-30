import Link from "next/link";
import type { ReactNode } from "react";
import type {
  AccountDashboardData,
  AccountOrderLineItem,
} from "@/lib/customer-account-data";
import { getDictionary, type Locale } from "@/lib/i18n";
import { ReorderButton } from "./ReorderButton";

type Props = {
  data: AccountDashboardData;
  locale: Locale;
  children?: ReactNode;
};

function summarizeLineItems(lineItems: AccountOrderLineItem[]): string {
  if (lineItems.length === 0) return "";
  const first = lineItems.slice(0, 2).map((li) => {
    const qty = li.quantity > 1 ? `${li.quantity}× ` : "";
    return `${qty}${li.title}`;
  });
  const rest = lineItems.length - first.length;
  return rest > 0 ? `${first.join(", ")} +${rest} more` : first.join(", ");
}

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

export function AccountDashboard({ data, locale, children }: Props) {
  const t = getDictionary(locale);
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
                  {locale === "ar" ? "مسجل دخول" : "Signed in"}
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
              {locale === "ar" ? "اطلب وجبات" : "Order meals"}
            </Link>
            <a
              href="/api/customer-account/logout"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#426237]/20 bg-white px-4 text-center text-sm font-semibold text-[#426237] transition-[background-color,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f4f1eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.97]"
            >
              {t.account.logout}
            </a>
          </div>
        </div>

        <nav
          className="hidden rounded-2xl bg-white/90 p-2 shadow-sm ring-1 ring-[#426237]/10 lg:block"
          aria-label="Account shortcuts"
        >
          <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            {locale === "ar" ? "روابط سريعة" : "Quick links"}
          </p>
          <Link
            href="/my-plan"
            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-[#426237] transition-colors hover:bg-[#f4f1eb]"
          >
            {locale === "ar" ? "اطلب خطة مخصوصة" : "Request custom plan"}
          </Link>
          <Link
            href="/menu"
            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-[#426237] transition-colors hover:bg-[#f4f1eb]"
          >
            {locale === "ar" ? "شوف المنيو" : "Browse menu"}
          </Link>
        </nav>
      </aside>

      <div className="min-w-0 space-y-6">
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#426237]/12">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#426237]/10 bg-[#faf9f6] px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#426237]/85">
                {locale === "ar" ? "الطلبات" : "Orders"}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {locale === "ar" ? "آخر مشترياتك على الحساب ده" : "Recent purchases on this account"}
              </p>
            </div>
          </div>

          {data.orders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium text-[#426237]">
                {locale === "ar" ? "لسه مفيش طلبات" : "No orders yet"}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                {locale === "ar"
                  ? "لما تعمل طلب من المنيو، الإيصالات هتظهر هنا."
                  : "When you check out from the menu, your receipts will appear in this table."}
              </p>
              <Link
                href="/menu"
                className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full bg-[#426237]/10 px-6 text-sm font-semibold text-[#426237] transition-[background-color,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#426237]/15 active:scale-[0.97]"
              >
                {locale === "ar" ? "ابدأ التسوق" : "Start shopping"}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[#426237]/8">
              {data.orders.map((o) => {
                const summary = summarizeLineItems(o.lineItems);
                return (
                  <li
                    key={o.id}
                    className="flex flex-col gap-3 bg-white px-5 py-4 transition-colors hover:bg-[#faf9f6]/60 sm:flex-row sm:items-center sm:gap-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        <p className="font-semibold text-[#426237]">#{o.number}</p>
                        <p className="text-xs tabular-nums text-gray-500">
                          {formatWhen(o.when)}
                        </p>
                        <p className="ml-auto text-sm font-semibold tabular-nums text-[#426237]">
                          {o.totalLabel}
                        </p>
                      </div>
                      {summary.length > 0 ? (
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {summary}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0">
                      <ReorderButton
                        orderNumber={o.number}
                        lineItems={o.lineItems}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {children != null ? <div className="space-y-3">{children}</div> : null}
      </div>
    </div>
  );
}
