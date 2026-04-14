import { describe, expect, it } from "vitest";
import {
  isValidShopifyCartGid,
  isValidShopifyCartLineGid,
  isValidShopifyProductVariantGid,
} from "@/lib/cart-input-validation";

describe("isValidShopifyCartGid", () => {
  it("accepts cart gid with optional key", () => {
    expect(
      isValidShopifyCartGid(
        "gid://shopify/Cart/c1-7a2abe82733a34e84aa472d57fb5c3c1?key=abc123",
      ),
    ).toBe(true);
  });
  it("rejects empty and dangerous chars", () => {
    expect(isValidShopifyCartGid("")).toBe(false);
    expect(isValidShopifyCartGid("gid://shopify/Cart/x\n")).toBe(false);
  });
});

describe("isValidShopifyCartLineGid", () => {
  it("accepts numeric suffix and key suffix", () => {
    expect(isValidShopifyCartLineGid("gid://shopify/CartLine/46011346389334")).toBe(
      true,
    );
    expect(
      isValidShopifyCartLineGid(
        "gid://shopify/CartLine/46011346389334?key=4418e0c8-aaaa-bbbb-cccc-ddddeeee",
      ),
    ).toBe(true);
  });
  it("rejects wrong prefix", () => {
    expect(isValidShopifyCartLineGid("gid://shopify/Product/1")).toBe(false);
  });
});

describe("isValidShopifyProductVariantGid", () => {
  it("accepts variant gid", () => {
    expect(
      isValidShopifyProductVariantGid("gid://shopify/ProductVariant/1234567890"),
    ).toBe(true);
  });
  it("rejects cart line", () => {
    expect(isValidShopifyProductVariantGid("gid://shopify/CartLine/1")).toBe(false);
  });
});
