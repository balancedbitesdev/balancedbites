import { NextResponse } from "next/server";
import {
  CUSTOMER_ACCOUNT_PKCE_COOKIE,
  buildAuthorizationUrl,
  customerAccountCallbackUrl,
  fetchOpenIdConfiguration,
  generateCodeChallenge,
  generateCodeVerifier,
  generateOAuthState,
} from "@/lib/customer-account-oauth";

export async function GET(request: Request) {
  const startUrl = new URL(request.url);
  const intentParam = startUrl.searchParams.get("intent");
  const authIntent: "signup" | "login" =
    intentParam === "signup" ? "signup" : "login";

  const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID?.trim();
  const redirectUri = customerAccountCallbackUrl();

  if (clientId == null || clientId === "" || redirectUri == null) {
    return NextResponse.json(
      {
        error:
          "Account sign-in is not configured. Set SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID and NEXT_PUBLIC_APP_URL (or SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI).",
      },
      { status: 503 },
    );
  }

  const openid = await fetchOpenIdConfiguration();
  if (openid == null) {
    return NextResponse.json(
      {
        error:
          "Could not reach account configuration. Check SHOPIFY_OPENID_DOMAIN or NEXT_PUBLIC_SHOPIFY_STORE_ORIGIN.",
      },
      { status: 502 },
    );
  }

  const verifier = generateCodeVerifier();
  const state = generateOAuthState();
  const challenge = generateCodeChallenge(verifier);

  const authUrl = buildAuthorizationUrl(openid.authorization_endpoint, {
    clientId,
    redirectUri,
    state,
    codeChallenge: challenge,
    authIntent,
  });

  const res = NextResponse.redirect(authUrl);
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.cookies.set(CUSTOMER_ACCOUNT_PKCE_COOKIE, JSON.stringify({ state, verifier }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return res;
}
