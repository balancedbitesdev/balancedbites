import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";
import {
  CUSTOMER_ACCOUNT_TOKEN_COOKIE,
  customerAccountCallbackUrl,
  isCustomerAccountOAuthConfigured,
} from "@/lib/customer-account-oauth";
import {
  shopifyAccountLoginUrl,
  shopifyAccountRegisterUrl,
} from "@/lib/shopify-customer-account-urls";
import { SavedPlanSection } from "./SavedPlanSection";

export const metadata: Metadata = {
  title: "My Account | Balanced Bites",
  description: "Profile, orders, saved nutrition plans, and subscriptions.",
};

type SearchParams = Promise<{
  auth_error?: string;
  auth_success?: string;
}>;

export default async function AccountPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const oauthConfigured = isCustomerAccountOAuthConfigured();
  const oauthCallbackUrl = customerAccountCallbackUrl();
  const jar = await cookies();
  const hasStoreSession = Boolean(jar.get(CUSTOMER_ACCOUNT_TOKEN_COOKIE)?.value);

  const registerUrl = shopifyAccountRegisterUrl();
  const loginUrl = shopifyAccountLoginUrl();

  const authError = sp.auth_error;
  const authSuccess = sp.auth_success === "1";

  return (
    <div className="min-h-full bg-[#f4f1eb] font-sans text-[#426237]">
      <SiteHeader active="account" orderNowHref="/menu" />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="menu-serif text-4xl font-semibold tracking-tight">My Account</h1>
        <p className="mt-3 text-sm text-gray-600">
          Your saved nutrition plan can stay on this device. Store accounts and order history live on
          Shopify—the same customer record you use at checkout.
        </p>

        {authError != null && authError !== "" ? (
          <p
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            Sign-in could not be completed: {decodeURIComponent(authError)}
          </p>
        ) : null}

        {authSuccess ? (
          <p
            className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900"
            role="status"
          >
            You&apos;re signed in on this browser. You can use the Customer Account API from the
            server with your session cookie when you wire order history.
          </p>
        ) : null}

        <section className="mt-12 space-y-4 rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-[#426237]/10">
          <h2 className="text-lg font-semibold text-[#426237]">Shopify store account</h2>

          {oauthConfigured ? (
            <>
              <p className="text-sm text-gray-600">
                Use the button below to sign in or create an account on Shopify. After you finish on
                the secure Shopify page, you&apos;ll be sent back to this site (
                <strong>same tab</strong>
                ).
              </p>
              <p className="text-xs text-gray-500">
                In Shopify Admin → <strong>Headless</strong> (or your app) →{" "}
                <strong>Customer Account API</strong>, add this exact redirect URL (character-for-character):
              </p>
              {oauthCallbackUrl != null ? (
                <p className="break-all rounded-lg bg-[#f4f1eb] px-3 py-2 font-mono text-[11px] text-[#426237] ring-1 ring-[#426237]/15">
                  {oauthCallbackUrl}
                </p>
              ) : null}
              <p className="text-xs text-gray-500">
                If you still see <strong>redirect_uri mismatch</strong>, set{" "}
                <code className="rounded bg-[#f4f1eb] px-1">
                  SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI
                </code>{" "}
                in production to that same string (fixes www vs non-www and typos in{" "}
                <code className="rounded bg-[#f4f1eb] px-1">NEXT_PUBLIC_APP_URL</code>
                ).
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href="/api/customer-account/start"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#426237] px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2c4224]"
                >
                  Sign in or create account
                </a>
                {hasStoreSession ? (
                  <a
                    href="/api/customer-account/logout"
                    className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#426237]/30 bg-white px-8 py-3 text-sm font-semibold text-[#426237] transition-colors hover:bg-[#f4f1eb]"
                  >
                    Sign out
                  </a>
                ) : null}
              </div>
            </>
          ) : null}

          {!oauthConfigured && registerUrl != null && loginUrl != null ? (
            <>
              <p className="text-sm text-gray-600">
                <strong>Recommended:</strong> set{" "}
                <code className="rounded bg-[#f4f1eb] px-1">
                  SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID
                </code>{" "}
                and{" "}
                <code className="rounded bg-[#f4f1eb] px-1">NEXT_PUBLIC_APP_URL</code> so customers
                return here after Shopify login (OAuth). Until then, these links open your Shopify
                account domain and may not return to this site automatically.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={registerUrl}
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#426237] px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2c4224]"
                >
                  Create store account
                </a>
                <a
                  href={loginUrl}
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#426237] bg-white px-8 py-3 text-sm font-semibold text-[#426237] transition-colors hover:bg-[#f4f1eb]"
                >
                  Sign in
                </a>
              </div>
            </>
          ) : null}

          {!oauthConfigured && (registerUrl == null || loginUrl == null) ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-200">
              Add{" "}
              <code className="rounded bg-white/80 px-1">SHOPIFY_STORE_DOMAIN</code> or{" "}
              <code className="rounded bg-white/80 px-1">NEXT_PUBLIC_SHOPIFY_STORE_ORIGIN</code>, and
              configure Customer Account OAuth (see above) for the best sign-in experience.
            </p>
          ) : null}
        </section>

        <section className="mt-8 space-y-4 rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-[#426237]/10">
          <h2 className="text-lg font-semibold text-[#426237]">Orders</h2>
          <p className="text-sm text-gray-600">
            After checkout you will receive email confirmation from Shopify. Use the cart icon in the
            header to review items on this site, then complete payment on Shopify&apos;s checkout
            page.
          </p>
          <Link
            href="/menu"
            className="inline-block text-sm font-semibold text-[#ac8058] hover:underline"
          >
            Browse the menu →
          </Link>
        </section>

        <section className="mt-8 space-y-4 rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-[#426237]/10">
          <h2 className="text-lg font-semibold text-[#426237]">Saved plans</h2>
          <SavedPlanSection />
        </section>

        <section className="mt-8 space-y-4 rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-[#426237]/10">
          <h2 className="text-lg font-semibold text-[#426237]">Subscriptions</h2>
          <p className="text-sm text-gray-600">
            Weekly meal subscriptions and selling plans will appear here once connected in Shopify
            (subscription apps or Shopify Subscriptions).
          </p>
        </section>
      </main>

      <SiteFooter variant="beige" />
    </div>
  );
}
