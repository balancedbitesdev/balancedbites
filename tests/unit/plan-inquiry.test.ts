import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitPlanInquiry } from "@/app/my-plan/actions";

describe("submitPlanInquiry server action", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.CONTACT_TO_EMAIL = "info@balancedbitesbd.com";
    process.env.RESEND_FROM = "noreply@balancedbitesbd.com";
  });

  afterEach(() => {
    process.env = { ...envBackup };
    vi.restoreAllMocks();
  });

  function createFormData(data: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [k, v] of Object.entries(data)) {
      fd.append(k, v);
    }
    return fd;
  }

  it("fails validation for short name and does NOT set whatsappFallback", async () => {
    const fd = createFormData({
      fullName: "A",
      email: "valid@example.com",
    });

    const res = await submitPlanInquiry(null, fd);
    expect(res.ok).toBe(false);
    expect(res.message).toContain("full name");
    expect(res.whatsappFallback).toBeFalsy();
  });

  it("fails validation for invalid email and does NOT set whatsappFallback", async () => {
    const fd = createFormData({
      fullName: "Jane Doe",
      email: "notanemail",
    });

    const res = await submitPlanInquiry(null, fd);
    expect(res.ok).toBe(false);
    expect(res.message).toContain("valid email");
    expect(res.whatsappFallback).toBeFalsy();
  });

  it("sets whatsappFallback: true when Resend API key is missing", async () => {
    delete process.env.RESEND_API_KEY;

    const fd = createFormData({
      fullName: "Jane Doe",
      email: "jane@example.com",
    });

    const res = await submitPlanInquiry(null, fd);
    expect(res.ok).toBe(false);
    expect(res.whatsappFallback).toBe(true);
  });

  it("sets whatsappFallback: true when CONTACT_TO_EMAIL is missing", async () => {
    delete process.env.CONTACT_TO_EMAIL;
    delete process.env.CONTACT_EMAIL;

    const fd = createFormData({
      fullName: "Jane Doe",
      email: "jane@example.com",
    });

    const res = await submitPlanInquiry(null, fd);
    expect(res.ok).toBe(false);
    expect(res.whatsappFallback).toBe(true);
  });

  it("sets whatsappFallback: true when Resend returns an API error", async () => {
    vi.mock("resend", () => {
      return {
        Resend: class {
          emails = {
            send: vi.fn().mockResolvedValue({
              error: { message: "Simulated Resend API failure" },
            }),
          };
        },
      };
    });

    const fd = createFormData({
      fullName: "Jane Doe",
      email: "jane@example.com",
    });

    const res = await submitPlanInquiry(null, fd);
    expect(res.ok).toBe(false);
    expect(res.whatsappFallback).toBe(true);
  });
});
