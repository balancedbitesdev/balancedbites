import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitPlanInquiry } from "@/app/my-plan/actions";

const mockSend = vi.fn();

vi.mock("resend", () => {
  return {
    Resend: class {
      emails = {
        send: mockSend,
      };
    },
  };
});

describe("submitPlanInquiry server action", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: "msg_plan_123" }, error: null });
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
    expect(mockSend).not.toHaveBeenCalled();
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
    expect(mockSend).not.toHaveBeenCalled();
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
    expect(mockSend).not.toHaveBeenCalled();
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
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sets whatsappFallback: true when Resend returns an API error", async () => {
    mockSend.mockResolvedValueOnce({
      error: { message: "Simulated Resend API failure" },
    });

    const fd = createFormData({
      fullName: "Jane Doe",
      email: "jane@example.com",
    });

    const res = await submitPlanInquiry(null, fd);
    expect(res.ok).toBe(false);
    expect(res.whatsappFallback).toBe(true);
  });

  it("sends confirmation email with user submitted data to visitor (English)", async () => {
    const sampleData = {
      fullName: "Sarah Connor",
      age: "29",
      gender: "Female",
      email: "sarah@example.com",
      phone: "+201234567890",
      weightKg: "65",
      heightCm: "170",
      bodyFatPct: "22",
      activityLevel: "Moderate",
      workType: "Active work",
      goal: "Fat Loss",
      targetWeightKg: "58",
      medicalConditions: "None",
      dietPreference: "Balanced",
      allergies: "Peanuts",
      dislikedFoods: "Fish",
      mealsPerDay: "3",
      sugarCravings: "No",
      lateNightEating: "No",
      notes: "Looking forward to starting next Monday.",
      locale: "en",
    };

    const fd = createFormData(sampleData);

    const res = await submitPlanInquiry(null, fd);
    expect(res.ok).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(2);

    // Call 1: Owner email
    const ownerEmail = mockSend.mock.calls[0][0];
    expect(ownerEmail.to).toEqual(["info@balancedbitesbd.com"]);
    expect(ownerEmail.subject).toContain("Sarah Connor");

    // Call 2: Visitor confirmation email
    const visitorEmail = mockSend.mock.calls[1][0];
    expect(visitorEmail.to).toEqual(["sarah@example.com"]);
    expect(visitorEmail.subject).toBe("We received your plan inquiry — Balanced Bites");

    // Double check that user submitted data is present in visitor's text and html bodies
    expect(visitorEmail.text).toContain("Sarah Connor");
    expect(visitorEmail.text).toContain("29");
    expect(visitorEmail.text).toContain("65 kg");
    expect(visitorEmail.text).toContain("170 cm");
    expect(visitorEmail.text).toContain("22%");
    expect(visitorEmail.text).toContain("Fat Loss");
    expect(visitorEmail.text).toContain("58 kg");
    expect(visitorEmail.text).toContain("Peanuts");
    expect(visitorEmail.text).toContain("Fish");
    expect(visitorEmail.text).toContain("Looking forward to starting next Monday.");

    expect(visitorEmail.html).toContain("Sarah Connor");
    expect(visitorEmail.html).toContain("sarah@example.com");
    expect(visitorEmail.html).toContain("65 kg");
    expect(visitorEmail.html).toContain("170 cm");
    expect(visitorEmail.html).toContain("22%");
    expect(visitorEmail.html).toContain("Fat Loss");
    expect(visitorEmail.html).toContain("Peanuts");
    expect(visitorEmail.html).toContain("Looking forward to starting next Monday.");
  });

  it("sends confirmation email with user submitted data to visitor (Arabic)", async () => {
    const sampleData = {
      fullName: "أحمد علي",
      age: "35",
      gender: "ذكر",
      email: "ahmed@example.com",
      phone: "+201000000000",
      weightKg: "85",
      heightCm: "180",
      bodyFatPct: "20",
      activityLevel: "متوسط",
      workType: "عمل مكتبي",
      goal: "بناء عضلات",
      targetWeightKg: "80",
      medicalConditions: "لا يوجد",
      dietPreference: "متوازن",
      allergies: "لا يوجد",
      dislikedFoods: "باذنجان",
      mealsPerDay: "4",
      sugarCravings: "نعم",
      lateNightEating: "لا",
      notes: "أريد استلام الخطة في أقرب وقت.",
      locale: "ar",
    };

    const fd = createFormData(sampleData);

    const res = await submitPlanInquiry(null, fd);
    expect(res.ok).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(2);

    // Call 2: Visitor confirmation email in Arabic
    const visitorEmail = mockSend.mock.calls[1][0];
    expect(visitorEmail.to).toEqual(["ahmed@example.com"]);
    expect(visitorEmail.subject).toBe("استلمنا طلب خطتك الغذائية — Balanced Bites");

    expect(visitorEmail.text).toContain("أحمد علي");
    expect(visitorEmail.text).toContain("85 kg");
    expect(visitorEmail.text).toContain("180 cm");
    expect(visitorEmail.text).toContain("بناء عضلات");
    expect(visitorEmail.text).toContain("باذنجان");
    expect(visitorEmail.text).toContain("أريد استلام الخطة في أقرب وقت.");

    expect(visitorEmail.html).toContain("أحمد علي");
    expect(visitorEmail.html).toContain("ahmed@example.com");
    expect(visitorEmail.html).toContain("85 kg");
    expect(visitorEmail.html).toContain("باذنجان");
    expect(visitorEmail.html).toContain("rtl");
  });
});
