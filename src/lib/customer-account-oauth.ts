import { createHash, randomBytes } from "node:crypto";

/** Temporary PKCE payload (httpOnly, cleared after callback). */
export const CUSTOMER_ACCOUNT_PKCE_COOKIE = "bb_ca_pkce";

/** Customer Account API access token (httpOnly). */
export const CUSTOMER_ACCOUNT_TOKEN_COOKIE = "bb_ca_at";

const OAUTH_SCOPE = "openid email customer-account-api:full";

export function isCustomerAccountOAuthConfigured(): boolean {
  return Boolean(
    process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID?.trim() &&
      customerAccountCallbackUrl() != null,
  );
}

function storefrontHost(): string | null {
  const raw =
    process.env.SHOPIFY_OPENID_DOMAIN?.trim() ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_ORIGIN?.trim() ||
    process.env.SHOPIFY_STORE_DOMAIN?.trim();
  if (raw == null || raw === "") return null;
  return raw.replace(/^https?:\/\//i, "").split("/")[0]?.replace(/\/$/, "") ?? null;
}

/** Storefront host for `/.well-known/*` discovery (Customer Account API GraphQL URL). */
export function customerAccountDiscoveryHost(): string | null {
  return storefrontHost();
}

/** Host that serves `/.well-known/openid-configuration` (usually your primary storefront domain). */
export function openIdConfigurationUrl(): string | null {
  const host = storefrontHost();
  if (host == null || host === "") return null;
  return `https://${host}/.well-known/openid-configuration`;
}

/**
 * Public site origin (no path). Used for post-login redirects to /account.
 * Normalizes trailing slash; lowercases hostname to avoid accidental www mismatches
 * when deriving the callback (prefer SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI if unsure).
 */
export function customerAccountAppBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw == null || raw === "" || !raw.startsWith("http")) return null;
  try {
    const u = new URL(raw.endsWith("/") ? raw.slice(0, -1) : raw);
    u.hostname = u.hostname.toLowerCase();
    return u.origin;
  } catch {
    return null;
  }
}

/**
 * OAuth redirect_uri — must match Shopify Headless “Customer Account API” allowlist **exactly**
 * (https vs http, www vs apex, path, trailing slash).
 *
 * Set `SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI` to the full callback URL from Shopify Admin
 * (copy-paste) when `NEXT_PUBLIC_APP_URL` does not match what you registered.
 */
export function customerAccountCallbackUrl(): string | null {
  const explicit = process.env.SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI?.trim();
  if (explicit != null && explicit !== "") {
    if (!explicit.startsWith("http://") && !explicit.startsWith("https://")) {
      return null;
    }
    return explicit;
  }
  const base = customerAccountAppBaseUrl();
  return base != null ? `${base}/api/customer-account/callback` : null;
}

export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function generateCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function generateOAuthState(): string {
  return randomBytes(24).toString("base64url");
}

export type OpenIdConfiguration = {
  authorization_endpoint: string;
  token_endpoint: string;
};

export async function fetchOpenIdConfiguration(): Promise<OpenIdConfiguration | null> {
  const url = openIdConfigurationUrl();
  if (url == null) return null;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as OpenIdConfiguration;
  if (
    typeof data.authorization_endpoint !== "string" ||
    typeof data.token_endpoint !== "string"
  ) {
    return null;
  }
  return data;
}

export function buildAuthorizationUrl(
  authorizationEndpoint: string,
  params: {
    clientId: string;
    redirectUri: string;
    state: string;
    codeChallenge: string;
    /** `signup` adds `screen_hint=signup` when the IdP supports it. */
    authIntent?: "signup" | "login";
  },
): string {
  const authUrl = new URL(authorizationEndpoint);
  authUrl.searchParams.set("client_id", params.clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", params.redirectUri);
  authUrl.searchParams.set("scope", OAUTH_SCOPE);
  authUrl.searchParams.set("state", params.state);
  authUrl.searchParams.set("code_challenge", params.codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  /** Force credential screen so users can switch accounts on a shared browser (OIDC). */
  authUrl.searchParams.set("prompt", "login");
  authUrl.searchParams.set("max_age", "0");
  if (params.authIntent === "signup") {
    authUrl.searchParams.set("screen_hint", "signup");
  }
  return authUrl.toString();
}

export { OAUTH_SCOPE };
