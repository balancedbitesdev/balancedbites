import { NextRequest, NextResponse } from "next/server";
import {
  CUSTOMER_ACCOUNT_PKCE_COOKIE,
  CUSTOMER_ACCOUNT_TOKEN_COOKIE,
  customerAccountAppBaseUrl,
  customerAccountCallbackUrl,
  fetchOpenIdConfiguration,
} from "@/lib/customer-account-oauth";
import { isValidShopifyCartGid } from "@/lib/cart-input-validation";
import { fetchAccountDashboardData } from "@/lib/customer-account-data";
import { createLogger, redactToken, truncateGid } from "@/lib/logger";
import {
  BB_CART_COOKIE,
  bbCartCookieOptions,
  storefrontCartBuyerIdentityUpdate,
} from "@/lib/shopify-cart";

const log = createLogger("api.oauth.callback");

function redirectToAccount(request: NextRequest, query: string) {
  const base = customerAccountAppBaseUrl() ?? new URL(request.url).origin;
  return NextResponse.redirect(new URL(`/account${query}`, base));
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const oauthError = params.get("error");
  if (oauthError != null) {
    const desc = params.get("error_description") ?? oauthError;
    log.warn("oauth_provider_error", { error: oauthError.slice(0, 120) });
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
    log.warn("callback_missing_code_or_state");
    const r = redirectToAccount(request, "?auth_error=missing_code");
    r.cookies.delete(CUSTOMER_ACCOUNT_PKCE_COOKIE);
    return r;
  }

  const pkceRaw = request.cookies.get(CUSTOMER_ACCOUNT_PKCE_COOKIE)?.value;

  if (pkceRaw == null) {
    log.warn("callback_pkce_cookie_missing");
    const r = redirectToAccount(request, "?auth_error=session_expired");
    r.cookies.delete(CUSTOMER_ACCOUNT_PKCE_COOKIE);
    return r;
  }

  let pkce: { state: string; verifier: string };
  try {
    pkce = JSON.parse(pkceRaw) as { state: string; verifier: string };
  } catch {
    log.warn("callback_pkce_parse_failed");
    const bad = redirectToAccount(request, "?auth_error=invalid_session");
    bad.cookies.delete(CUSTOMER_ACCOUNT_PKCE_COOKIE);
    return bad;
  }

  if (pkce.state !== state) {
    log.warn("callback_state_mismatch");
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
    log.error("callback_oauth_config_incomplete");
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
    log.warn("token_exchange_http_status", { status: tokenRes.status });
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
    log.warn("token_response_missing_access_token");
    const bad = redirectToAccount(request, "?auth_error=no_access_token");
    bad.cookies.delete(CUSTOMER_ACCOUNT_PKCE_COOKIE);
    return bad;
  }

  const maxAge =
    typeof tokenData.expires_in === "number" && tokenData.expires_in > 0
      ? tokenData.expires_in
      : 60 * 60 * 24;

  log.info("oauth_login_success", {
    token: redactToken(tokenData.access_token),
    maxAge,
  });

  const ok = redirectToAccount(request, "");
  ok.cookies.delete(CUSTOMER_ACCOUNT_PKCE_COOKIE);
  ok.cookies.set(CUSTOMER_ACCOUNT_TOKEN_COOKIE, tokenData.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  const cartId = request.cookies.get(BB_CART_COOKIE)?.value;
  if (cartId != null && cartId !== "" && isValidShopifyCartGid(cartId)) {
    try {
      const profile = await fetchAccountDashboardData(tokenData.access_token);
      const email = profile?.email;
      if (email != null && email !== "") {
        const { cart, errors } = await storefrontCartBuyerIdentityUpdate(cartId, {
          email,
        });
        if (errors.length === 0 && cart != null) {
          ok.cookies.set(BB_CART_COOKIE, cart.id, bbCartCookieOptions());
          log.info("cart_buyer_identity_updated", {
            cartId: truncateGid(cart.id),
          });
        } else {
          log.warn("cart_buyer_identity_failed", {
            detail: errors[0] ?? "null_cart",
          });
        }
      }
    } catch (e) {
      log.warn("cart_merge_exception", {
        err: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return ok;
}
