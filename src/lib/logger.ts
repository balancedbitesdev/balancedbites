/**
 * Structured JSON logs for Vercel (Runtime Logs): one JSON object per line, easy to filter search.
 * Never pass secrets, raw OAuth codes, or full access tokens — use redactToken / truncateGid.
 */

export const LOG_SERVICE = "balanced-bites";

export type LogFields = Record<string, unknown>;

function emit(
  level: "debug" | "info" | "warn" | "error",
  scope: string,
  msg: string,
  fields?: LogFields,
): void {
  const payload: Record<string, unknown> = {
    ts: new Date().toISOString(),
    service: LOG_SERVICE,
    level,
    scope,
    msg,
    ...fields,
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

/** Create a scoped logger (e.g. `api.cart`, `shopify.fetch`). */
export function createLogger(scope: string) {
  return {
    debug: (msg: string, fields?: LogFields) => emit("debug", scope, msg, fields),
    info: (msg: string, fields?: LogFields) => emit("info", scope, msg, fields),
    warn: (msg: string, fields?: LogFields) => emit("warn", scope, msg, fields),
    error: (msg: string, fields?: LogFields) => emit("error", scope, msg, fields),
  };
}

/** Shorten Shopify GIDs for logs (Vercel search stays useful without full tokens). */
export function truncateGid(id: string | null | undefined, max = 40): string {
  if (id == null || id === "") return "";
  if (id.length <= max) return id;
  return `${id.slice(0, max)}…`;
}

/** Log presence of a bearer token without leaking it. */
export function redactToken(token: string | null | undefined): string {
  if (token == null || token === "") return "none";
  if (token.length <= 12) return "[redacted]";
  return `${token.slice(0, 6)}…${token.slice(-4)} (${token.length} chars)`;
}
