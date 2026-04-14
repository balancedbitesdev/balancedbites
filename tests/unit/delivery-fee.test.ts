import { afterEach, describe, expect, it } from "vitest";
import { getDeliveryFeeEgp } from "@/lib/delivery-fee";

describe("getDeliveryFeeEgp", () => {
  const orig = process.env.NEXT_PUBLIC_DELIVERY_FEE_EGP;

  afterEach(() => {
    if (orig === undefined) {
      delete process.env.NEXT_PUBLIC_DELIVERY_FEE_EGP;
    } else {
      process.env.NEXT_PUBLIC_DELIVERY_FEE_EGP = orig;
    }
  });

  it("defaults to 50 when unset", () => {
    delete process.env.NEXT_PUBLIC_DELIVERY_FEE_EGP;
    expect(getDeliveryFeeEgp()).toBe(50);
  });

  it("reads env number", () => {
    process.env.NEXT_PUBLIC_DELIVERY_FEE_EGP = "75";
    expect(getDeliveryFeeEgp()).toBe(75);
  });

  it("falls back on invalid", () => {
    process.env.NEXT_PUBLIC_DELIVERY_FEE_EGP = "nope";
    expect(getDeliveryFeeEgp()).toBe(50);
  });
});
