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
    <div className="min-h-full bg-[#f4f1eb] font-sans text-[#426237]">
      <SiteHeader active="account" orderNowHref="/menu" />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="menu-serif text-4xl font-semibold tracking-tight">Account</h1>
        <p className="mt-3 max-w-xl text-sm text-gray-600">
          Sign in to see your orders and profile. Checkout still uses our secure payment flow in
          one step when you buy from the menu.
        </p>

        {authError != null && authError !== "" ? (
          <p
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            {decodeURIComponent(authError)}
          </p>
        ) : null}

        {token != null && dashboardData != null ? (
          <>
            <div className="mt-10">
              <AccountDashboard data={dashboardData} />
            </div>
            <section className="mt-10 space-y-4 rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-[#426237]/10">
              <h2 className="text-lg font-semibold text-[#426237]">Saved plan</h2>
              <SavedPlanSection />
            </section>
          </>
        ) : null}

        {token != null && dashboardData == null ? (
          <div className="mt-10 rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-[#426237]/10">
            <p className="text-sm text-gray-600">
              We couldn&apos;t load your account details right now. Try signing out and signing in
              again.
            </p>
            <a
              href="/api/customer-account/logout"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#426237]/30 bg-white px-8 py-3 text-sm font-semibold text-[#426237] transition-[background-color,transform] duration-200 ease-out hover:bg-[#f4f1eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95"
            >
              Log out
            </a>
          </div>
        ) : null}

        {token == null ? (
          <div className="mt-10 rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-[#426237]/10">
            {oauthConfigured ? (
              <>
                <p className="text-sm text-gray-600">
                  New here or returning? Continue in the secure window, then you&apos;ll land back on
                  this page.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/api/customer-account/start?intent=signup"
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#426237] px-8 py-3 text-center text-sm font-semibold text-white shadow-[0_14px_36px_-20px_rgba(66,98,55,0.55)] transition-[background-color,box-shadow,transform] duration-200 ease-out hover:bg-[#2c4224] hover:shadow-[0_18px_40px_-18px_rgba(66,98,55,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95"
                  >
                    Sign up
                  </a>
                  <a
                    href="/api/customer-account/start?intent=login"
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border-2 border-[#426237] bg-white px-8 py-3 text-center text-sm font-semibold text-[#426237] transition-[background-color,box-shadow,transform] duration-200 ease-out hover:bg-[#f4f1eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95"
                  >
                    Log in
                  </a>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-600">
                Online accounts aren&apos;t enabled on this deployment yet. You can still shop from
                the menu and complete checkout as a guest.
              </p>
            )}
            <section className="mt-10 border-t border-[#426237]/10 pt-8">
              <h2 className="text-lg font-semibold text-[#426237]">Saved plan (this device)</h2>
              <p className="mt-1 text-xs text-gray-500">
                Stored only in your browser until you sign in above.
              </p>
              <div className="mt-4">
                <SavedPlanSection />
              </div>
            </section>
            <p className="mt-8 text-center text-sm text-gray-500">
              <Link href="/menu" className="font-semibold text-[#ac8058] hover:underline">
                Browse the menu
              </Link>
            </p>
          </div>
        ) : null}

      </main>

      <SiteFooter />
    </div>
  );
}
