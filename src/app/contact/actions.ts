"use server";

export type ContactState = {
  ok: boolean;
  message: string;
};

export async function submitContact(
  _prev: ContactState | null,
  formData: FormData,
): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (name.length < 2) {
    return { ok: false, message: "Please enter your name." };
  }
  if (email.length < 5 || !email.includes("@")) {
    return { ok: false, message: "Please enter a valid email." };
  }
  if (message.length < 10) {
    return { ok: false, message: "Please enter a longer message (at least 10 characters)." };
  }

  // Submissions are validated here only — nothing is emailed or stored until you wire
  // Resend, SendGrid, a database, or a CRM (see env / integration docs).
  void phone;

  return {
    ok: true,
    message:
      "Thank you. We received your message. For the fastest reply, message us on WhatsApp using the button above.",
  };
}
