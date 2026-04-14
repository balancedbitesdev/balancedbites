/**
 * Maps Shopify / network cart errors to calm, non-alarming copy for customers.
 */
export function friendlyCartError(raw: string | undefined | null): string {
  if (raw == null || raw.trim() === "") {
    return "That didn’t go through—give it another try in a moment.";
  }
  const r = raw.toLowerCase();

  if (
    r.includes("does not exist") ||
    r.includes("not found") ||
    r.includes("specified cart") ||
    r.includes("invalid cart")
  ) {
    return "Your bag was refreshed. Add what you like whenever you’re ready.";
  }

  if (
    r.includes("no cart") ||
    r.includes("invalid line") ||
    r.includes("cart line") ||
    r.includes("merchandise") ||
    r.includes("variant") ||
    r.includes("quantity") ||
    r.includes("sold out") ||
    r.includes("unavailable")
  ) {
    return "We couldn’t update that item—try once more, or pick it fresh from the menu.";
  }

  if (r.includes("network") || r.includes("fetch") || r.includes("timeout")) {
    return "Connection hiccup—try again in a second.";
  }

  if (r.includes("json") || r.includes("invalid")) {
    return "Something got out of sync—refresh the page and you’re good.";
  }

  return "That didn’t go through—give it another try in a moment.";
}
