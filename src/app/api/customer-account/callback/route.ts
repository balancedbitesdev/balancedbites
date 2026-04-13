import { NextRequest, NextResponse } from "next/server";
import {
  CUSTOMER_ACCOUNT_PKCE_COOKIE,
  CUSTOMER_ACCOUNT_TOKEN_COOKIE,
  customerAccountAppBaseUrl,
  customerAccountCallbackUrl,
  fetchOpenIdConfiguration,
} from "@/lib/customer-account-oauth";

function redirectToAccount(request: NextRequest, query: string) {
  const base = customerAccountAppBaseUrl() ?? new URL(request.url).origin;
  return NextResponse.redirect(new URL(`/account${query}`, base));
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const oauthError = params.get("error");
  if (oauthError != null) {
    const desc = params.get("error_description") ?? oauthError;
    const r = redirectToAccount(
      request,
      `?auth_error=${encodeURIComponent(desc.slice(0, 500))}`,
    );
    r.cookies.delete(CUSTOMER_ACCOUNT_PKCE_COOKIE);
    return r;
  }

  const code = params.get("code");
  const state = params.get("state");
  if (code == null || state == null) {
    const r = redirectToAccount(request, "?auth_error=missing_code");
    r.cookies.delete(CUSTOMER_ACCOUNT_PKCE_COOKIE);
    return r;
  }

  const pkceRaw = request.cookies.get(CUSTOMER_ACCOUNT_PKCE_COOKIE)?.value;

  if (pkceRaw == null) {
    const r = redirectToAccount(request, "?auth_error=session_expired");
    r.cookies.delete(CUSTOMER_ACCOUNT_PKCE_COOKIE);
    return r;
  }

  let pkce: { state: string; verifier: string };
  try {
    pkce = JSON.parse(pkceRaw) as { state: string; verifier: string };
  } catch {
    const bad = redirectToAccount(request, "?auth_error=invalid_session");
    bad.cookies.delete(CUSTOMER_ACCOUNT_PKCE_COOKIE);
    return bad;
  }

  if (pkce.state !== state) {
    const bad = redirectToAccount(request, "?auth_error=state_mismatch");
    bad.cookies.delete(CUSTOMER_ACCOUNT_PKCE_COOKIE);
    return bad;
  }

  const openid = await fetchOpenIdConfiguration();
  const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID?.trim();
  const redirectUri = customerAccountCallbackUrl();
  const clientSecret = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET?.trim();

  if (
    openid == null ||
    clientId == null ||
    clientId === "" ||
    redirectUri == null
  ) {
    const bad = redirectToAccount(request, "?auth_error=config");
    bad.cookies.delete(CUSTOMER_ACCOUNT_PKCE_COOKIE);
    return bad;
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
    code_verifier: pkce.verifier,
  });
  if (clientSecret != null && clientSecret !== "") {
    body.set("client_secret", clientSecret);
  }

  const tokenRes = await fetch(openid.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!tokenRes.ok) {
    const bad = redirectToAccount(
      request,
      "?auth_error=token_exchange_failed",
    );
    bad.cookies.delete(CUSTOMER_ACCOUNT_PKCE_COOKIE);
    return bad;
  }

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (tokenData.access_token == null || tokenData.access_token === "") {
    const bad = redirectToAccount(request, "?auth_error=no_access_token");
    bad.cookies.delete(CUSTOMER_ACCOUNT_PKCE_COOKIE);
    return bad;
  }

  const maxAge =
    typeof tokenData.expires_in === "number" && tokenData.expires_in > 0
      ? tokenData.expires_in
      : 60 * 60 * 24;

  const ok = redirectToAccount(request, "");
  ok.cookies.delete(CUSTOMER_ACCOUNT_PKCE_COOKIE);
  ok.cookies.set(CUSTOMER_ACCOUNT_TOKEN_COOKIE, tokenData.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return ok;
}
