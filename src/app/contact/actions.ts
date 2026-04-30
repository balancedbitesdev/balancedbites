"use server";

import { Resend } from "resend";

export type ContactState = {
  ok: boolean;
  message: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getResendEnv(): {
  apiKey: string | undefined;
  to: string | undefined;
  from: string | undefined;
  missing: string[];
} {
  const apiKey = process.env.RESEND_API_KEY?.trim() || undefined;
  const to =
    process.env.CONTACT_TO_EMAIL?.trim() ||
    process.env.CONTACT_EMAIL?.trim() ||
    undefined;
  const from =
    process.env.RESEND_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    undefined;

  const missing: string[] = [];
  if (!apiKey) missing.push("RESEND_API_KEY");
  if (!to) missing.push("CONTACT_TO_EMAIL (or CONTACT_EMAIL)");
  if (!from) missing.push("RESEND_FROM (or RESEND_FROM_EMAIL)");

  return { apiKey, to, from, missing };
}

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

  const { apiKey, to, from, missing } = getResendEnv();

  if (!apiKey || !to || !from) {
    console.error(
      `[Contact form] Missing Resend env: ${missing.join(", ")}. Add them to .env.local (local) or the host’s env (e.g. Vercel → Settings → Environment Variables), then restart.`,
    );
    return {
      ok: false,
      message:
        process.env.NODE_ENV === "development"
          ? `Email not configured yet — add to .env.local: ${missing.join(", ")}. Restart \`next dev\`. (This is not a route bug; the server action has no Resend keys.)`
          : "We couldn’t send your message right now. Please use WhatsApp above or try again later.",
    };
  }

  const resend = new Resend(apiKey);

  const phoneLine = phone.length > 0 ? phone : "(not provided)";
  const textBody = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phoneLine}`,
    "",
    "Message:",
    message,
  ].join("\n");

  const htmlBody = `
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phoneLine)}</p>
    <p><strong>Message:</strong></p>
    <p style="white-space:pre-wrap;font-family:system-ui,sans-serif">${escapeHtml(message)}</p>
  `;

  const visitorSubject = "We received your message — Balanced Bites";
  const visitorText = `Hi ${name},

Thanks for getting in touch with Balanced Bites.

We've received your message and will respond as soon as we can. We appreciate your patience.

If something is urgent, you're always welcome to message us on WhatsApp for a quicker chat.

Warmly,
The Balanced Bites team
`;

  const visitorHtml = `
    <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:32rem">
      <p>Hi ${escapeHtml(name)},</p>
      <p>Thanks for getting in touch with <strong style="color:#426237">Balanced Bites</strong>.</p>
      <p>We've received your message and will respond as soon as we can. We appreciate your patience.</p>
      <p>If something is urgent, you're always welcome to message us on <strong>WhatsApp</strong> for a quicker chat.</p>
      <p style="margin-top:1.75rem;color:#426237">Warmly,<br />The Balanced Bites team</p>
    </div>
  `;

  try {
    const ownerSend = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `[Balanced Bites] Message from ${name}`,
      text: textBody,
      html: htmlBody,
    });

    if (ownerSend.error) {
      console.error("Resend API error (owner):", ownerSend.error);
      return {
        ok: false,
        message:
          "We couldn’t send your message. Please try again or reach us on WhatsApp above.",
      };
    }

    const visitorSend = await resend.emails.send({
      from,
      to: [email],
      replyTo: to,
      subject: visitorSubject,
      text: visitorText,
      html: visitorHtml,
    });

    if (visitorSend.error) {
      console.error("Resend API error (visitor confirmation):", visitorSend.error);
      // Owner already got the lead; still thank the user on the page.
    }
  } catch (err) {
    console.error("Contact form send failed:", err);
    return {
      ok: false,
      message:
        "We couldn’t send your message. Please try again or reach us on WhatsApp above.",
    };
  }

  return {
    ok: true,
    message:
      "Thank you! We’ve sent a confirmation to your email — we’ll reply as soon as we can. For the fastest response, you can also reach us on WhatsApp above.",
  };
}
