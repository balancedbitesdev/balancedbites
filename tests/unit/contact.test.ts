import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitContact } from "@/app/contact/actions";

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

describe("submitContact server action", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: "msg_123" }, error: null });
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

  it("fails validation when name is too short", async () => {
    const fd = createFormData({
      name: "A",
      email: "valid@example.com",
      message: "Hello world this is a test message",
    });

    const res = await submitContact(null, fd);
    expect(res.ok).toBe(false);
    expect(res.message).toContain("name");
  });

  it("fails validation when email is invalid", async () => {
    const fd = createFormData({
      name: "John Doe",
      email: "invalid-email",
      message: "Hello world this is a test message",
    });

    const res = await submitContact(null, fd);
    expect(res.ok).toBe(false);
    expect(res.message).toContain("valid email");
  });

  it("fails validation when message is too short", async () => {
    const fd = createFormData({
      name: "John Doe",
      email: "john@example.com",
      message: "Short",
    });

    const res = await submitContact(null, fd);
    expect(res.ok).toBe(false);
    expect(res.message).toContain("longer message");
  });

  it("sends confirmation email to user including user filled data (English)", async () => {
    const fd = createFormData({
      name: "Sarah Connor",
      email: "sarah@example.com",
      phone: "+201234567890",
      message: "I would like to inquire about customized meal plans.",
      locale: "en",
    });

    const res = await submitContact(null, fd);
    expect(res.ok).toBe(true);

    expect(mockSend).toHaveBeenCalledTimes(2);

    // Call 1: Owner email
    const ownerEmail = mockSend.mock.calls[0][0];
    expect(ownerEmail.to).toEqual(["info@balancedbitesbd.com"]);
    expect(ownerEmail.subject).toContain("Sarah Connor");

    // Call 2: Visitor confirmation email
    const visitorEmail = mockSend.mock.calls[1][0];
    expect(visitorEmail.to).toEqual(["sarah@example.com"]);
    expect(visitorEmail.subject).toBe("We received your message — Balanced Bites");

    // Double check that user submitted data is in both HTML and text bodies
    expect(visitorEmail.text).toContain("Sarah Connor");
    expect(visitorEmail.text).toContain("sarah@example.com");
    expect(visitorEmail.text).toContain("+201234567890");
    expect(visitorEmail.text).toContain("I would like to inquire about customized meal plans.");

    expect(visitorEmail.html).toContain("Sarah Connor");
    expect(visitorEmail.html).toContain("sarah@example.com");
    expect(visitorEmail.html).toContain("+201234567890");
    expect(visitorEmail.html).toContain("I would like to inquire about customized meal plans.");
  });

  it("sends confirmation email to user including user filled data (Arabic)", async () => {
    const fd = createFormData({
      name: "أحمد علي",
      email: "ahmed@example.com",
      phone: "+201112223334",
      message: "أريد الاستفسار عن تفاصيل خطة الكيتو للوجبات.",
      locale: "ar",
    });

    const res = await submitContact(null, fd);
    expect(res.ok).toBe(true);

    expect(mockSend).toHaveBeenCalledTimes(2);

    const visitorEmail = mockSend.mock.calls[1][0];
    expect(visitorEmail.to).toEqual(["ahmed@example.com"]);
    expect(visitorEmail.subject).toBe("استلمنا رسالتك — Balanced Bites");

    // Double check that Arabic labels and user submitted data are present
    expect(visitorEmail.text).toContain("أحمد علي");
    expect(visitorEmail.text).toContain("ahmed@example.com");
    expect(visitorEmail.text).toContain("+201112223334");
    expect(visitorEmail.text).toContain("أريد الاستفسار عن تفاصيل خطة الكيتو للوجبات.");

    expect(visitorEmail.html).toContain("أحمد علي");
    expect(visitorEmail.html).toContain("ahmed@example.com");
    expect(visitorEmail.html).toContain("+201112223334");
    expect(visitorEmail.html).toContain("أريد الاستفسار عن تفاصيل خطة الكيتو للوجبات.");
  });
});
