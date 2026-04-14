import { describe, expect, it } from "vitest";
import { friendlyCartError } from "@/lib/friendly-cart-errors";

describe("friendlyCartError", () => {
  it("returns generic copy for empty input", () => {
    expect(friendlyCartError(null)).toContain("try");
    expect(friendlyCartError("")).toContain("try");
  });

  it("maps cart-not-found style messages", () => {
    expect(friendlyCartError("The specified cart does not exist")).toContain("refreshed");
  });

  it("maps network style messages", () => {
    expect(friendlyCartError("Network error")).toContain("Connection");
  });
});
