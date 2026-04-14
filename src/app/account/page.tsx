import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";
import { fetchAccountDashboardData } from "@/lib/customer-account-data";
import {
  CUSTOMER_ACCOUNT_TOKEN_COOKIE,
  isCustomerAccountOAuthConfigured,
} from "@/lib/customer-account-oauth";
import { AccountDashboard } from "./AccountDashboard";
import { SavedPlanSection } from "./SavedPlanSection";

export const metadata: Metadata = {
  title: "My Account | Balanced Bites",
  description: "Your Balanced Bites account, orders, and saved plans.",
};

type SearchParams = Promise<{
  auth_error?: string;
}>;

export default async function AccountPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const oauthConfigured = isCustomerAccountOAuthConfigured();
  const jar = await cookies();
  const token = jar.get(CUSTOMER_ACCOUNT_TOKEN_COOKIE)?.value ?? null;

  const authError = sp.auth_error;

  const dashboardData =
    token != null && token !== "" ? await fetchAccountDashboardData(token) : null;

  return (
    <div className="min-h-full bg-[#ebe6dc] font-sans text-[#426237]">
      <SiteHeader active="account" orderNowHref="/menu" />

      <main className="mx-auto max-w-6xl px-4 pb-8 pt-3 sm:px-6 sm:pb-10 sm:pt-4">
        <header className="border-b border-[#426237]/15 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ac8058]">
            Customer
          </p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="menu-serif text-3xl font-semibold tracking-tight text-[#426237] sm:text-4xl">
                My account
              </h1>
              <p className="mt-2 max-w-xl text-sm text-gray-600">
                Orders, profile, and your saved plan—same secure checkout when you buy from the
                menu.
              </p>
            </div>
            <Link
              href="/menu"
              className="inline-flex shrink-0 items-center justify-center self-start rounded-full border border-[#426237]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#426237] shadow-sm transition-[background-color,transform,box-shadow] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f4f1eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#ebe6dc] active:scale-[0.97] sm:self-auto"
            >
              Shop menu
            </Link>
          </div>
        </header>

        {authError != null && authError !== "" ? (
          <div
            className="mt-8 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm ring-1 ring-amber-100"
            role="alert"
          >
            <p className="font-medium text-amber-900/90">Sign-in didn&apos;t finish</p>
            <p className="mt-1 text-amber-900/80">{decodeURIComponent(authError)}</p>
          </div>
        ) : null}

        {token != null && dashboardData != null ? (
          <div className="mt-10">
            <AccountDashboard data={dashboardData}>
              <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#426237]/12">
                <div className="border-b border-[#426237]/10 bg-[#faf9f6] px-5 py-4">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#426237]/85">
                    Nutrition plan
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    From your quiz—stored on this device until you replace it
                  </p>
                </div>
                <div className="px-5 py-5">
                  <SavedPlanSection variant="account" />
                </div>
              </section>
            </AccountDashboard>
          </div>
        ) : null}

        {token != null && dashboardData == null ? (
          <div className="mt-10 overflow-hidden rounded-2xl border border-[#426237]/12 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-medium text-[#426237]">We couldn&apos;t load your dashboard</p>
            <p className="mt-2 text-sm text-gray-600">
              Try signing out and signing back in. Your cart and menu order are unchanged.
            </p>
            <a
              href="/api/customer-account/logout"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#426237]/25 bg-[#f4f1eb] px-8 py-3 text-sm font-semibold text-[#426237] transition-[background-color,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#ebe6dc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.97]"
            >
              Log out
            </a>
          </div>
        ) : null}

        {token == null ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-12">
            <div className="hidden rounded-2xl bg-[#426237]/[0.06] p-6 ring-1 ring-[#426237]/10 lg:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ac8058]">
                Your account includes
              </p>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#426237] shadow-sm ring-1 ring-[#426237]/15">
                    1
                  </span>
                  <span>
                    <span className="font-semibold text-[#426237]">Order history</span> in one
                    place—dates and totals at a glance.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#426237] shadow-sm ring-1 ring-[#426237]/15">
                    2
                  </span>
                  <span>
                    <span className="font-semibold text-[#426237]">Saved meal plan</span> from the
                    quiz, tied to this browser until you update it.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#426237] shadow-sm ring-1 ring-[#426237]/15">
                    3
                  </span>
                  <span>
                    <span className="font-semibold text-[#426237]">Secure sign-in</span> through
                    Shopify—same checkout you already trust.
                  </span>
                </li>
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-[#426237]/12">
              <div className="border-b border-[#426237]/10 bg-gradient-to-br from-[#faf9f6] to-white px-6 py-5">
                <h2 className="text-lg font-semibold text-[#426237]">Sign in</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Use the secure window—then you&apos;ll return here automatically.
                </p>
              </div>
              <div className="p-6">
                {oauthConfigured ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <a
                      href="/api/customer-account/start?intent=signup"
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[#426237] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_32px_-18px_rgba(66,98,55,0.55)] transition-[background-color,box-shadow,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#2c4224] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.97]"
                    >
                      Create account
                    </a>
                    <a
                      href="/api/customer-account/start?intent=login"
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[#426237]/25 bg-white px-6 py-3 text-center text-sm font-semibold text-[#426237] transition-[background-color,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f4f1eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.97]"
                    >
                      Log in
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    Online accounts aren&apos;t enabled on this deployment yet. You can still shop
                    from the menu as a guest.
                  </p>
                )}

                <section className="mt-8 border-t border-[#426237]/10 pt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
                    Saved plan (this device)
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Visible here before you sign in—stored only in this browser.
                  </p>
                  <div className="mt-4">
                    <SavedPlanSection variant="guest" />
                  </div>
                </section>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
