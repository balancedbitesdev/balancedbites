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

export async function GET() {
  const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID?.trim();
  const redirectUri = customerAccountCallbackUrl();

  if (clientId == null || clientId === "" || redirectUri == null) {
    return NextResponse.json(
      {
        error:
          "Customer Account OAuth is not configured. Set SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID and either NEXT_PUBLIC_APP_URL or SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI (full callback URL).",
      },
      { status: 503 },
    );
  }

  const openid = await fetchOpenIdConfiguration();
  if (openid == null) {
    return NextResponse.json(
      {
        error:
          "Could not load OpenID configuration. Set SHOPIFY_OPENID_DOMAIN or NEXT_PUBLIC_SHOPIFY_STORE_ORIGIN to the storefront host that serves /.well-known/openid-configuration.",
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
  });

  const res = NextResponse.redirect(authUrl);
  res.cookies.set(CUSTOMER_ACCOUNT_PKCE_COOKIE, JSON.stringify({ state, verifier }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return res;
}
