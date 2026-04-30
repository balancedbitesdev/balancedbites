"use server";

import { Resend } from "resend";

export type PlanInquiryResult = {
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

// Swap this with a DB write (Supabase / Sheets / Postgres) later — the email is
// the lightweight "DB" for now so the owner has a durable inbox record.
export async function submitPlanInquiry(
  _prev: PlanInquiryResult | null,
  formData: FormData,
): Promise<PlanInquiryResult> {
  const get = (key: string) => String(formData.get(key) ?? "").trim();

  const fullName = get("fullName");
  const email = get("email");
  const phone = get("phone");
  const age = get("age");
  const gender = get("gender");
  const weightKg = get("weightKg");
  const heightCm = get("heightCm");
  const activityLevel = get("activityLevel");
  const goal = get("goal");
  const dietPreference = get("dietPreference");
  const allergies = get("allergies");
  const preferredTier = get("preferredTier");
  const notes = get("notes");

  if (fullName.length < 2) {
    return {
      ok: false,
      message: "Please enter your full name.",
    };
  }
  if (email.length < 5 || !email.includes("@")) {
    return {
      ok: false,
      message: "Please enter a valid email so we can reach you.",
    };
  }

  const { apiKey, to, from, missing } = getResendEnv();

  const textSections: string[] = [
    "CONTACT",
    `  Full name: ${fullName}`,
    `  Email: ${email}`,
    `  Phone: ${phone.length > 0 ? phone : "(not provided)"}`,
    "",
    "ABOUT THEM",
    `  Age: ${age.length > 0 ? age : "(not provided)"}`,
    `  Gender: ${gender.length > 0 ? gender : "(not provided)"}`,
    `  Weight: ${weightKg.length > 0 ? `${weightKg} kg` : "(not provided)"}`,
    `  Height: ${heightCm.length > 0 ? `${heightCm} cm` : "(not provided)"}`,
    `  Activity level: ${activityLevel.length > 0 ? activityLevel : "(not provided)"}`,
    "",
    "GOALS & PREFERENCES",
    `  Goal: ${goal.length > 0 ? goal : "(not provided)"}`,
    `  Diet preference: ${dietPreference.length > 0 ? dietPreference : "(not provided)"}`,
    `  Allergies / intolerances: ${allergies.length > 0 ? allergies : "(none)"}`,
    `  Preferred subscription tier: ${preferredTier.length > 0 ? preferredTier : "(not specified)"}`,
    "",
    "NOTES",
    `  ${notes.length > 0 ? notes : "(none)"}`,
  ];

  const textBody = textSections.join("\n");

  const htmlRows: string[] = [];
  const row = (label: string, value: string) =>
    htmlRows.push(
      `<tr><td style="padding:6px 14px 6px 0;color:#6b5b4d;font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;color:#1f2937;font-size:13px">${escapeHtml(value)}</td></tr>`,
    );

  row("Full name", fullName);
  row("Email", email);
  row("Phone", phone.length > 0 ? phone : "(not provided)");
  row("Age", age.length > 0 ? age : "(not provided)");
  row("Gender", gender.length > 0 ? gender : "(not provided)");
  row("Weight", weightKg.length > 0 ? `${weightKg} kg` : "(not provided)");
  row("Height", heightCm.length > 0 ? `${heightCm} cm` : "(not provided)");
  row(
    "Activity level",
    activityLevel.length > 0 ? activityLevel : "(not provided)",
  );
  row("Goal", goal.length > 0 ? goal : "(not provided)");
  row(
    "Diet preference",
    dietPreference.length > 0 ? dietPreference : "(not provided)",
  );
  row("Allergies", allergies.length > 0 ? allergies : "(none)");
  row(
    "Preferred tier",
    preferredTier.length > 0 ? preferredTier : "(not specified)",
  );
  row("Notes", notes.length > 0 ? notes : "(none)");

  const htmlBody = `
    <div style="font-family:system-ui,-apple-system,sans-serif;color:#1f2937">
      <h2 style="margin:0 0 16px;color:#426237;font-size:18px">New custom plan inquiry — ${escapeHtml(fullName)}</h2>
      <table style="border-collapse:collapse;font-size:13px;line-height:1.55">
        <tbody>${htmlRows.join("")}</tbody>
      </table>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb" />
      <p style="margin:0;color:#6b7280;font-size:12px">Reply directly to this email to reach ${escapeHtml(fullName)}.</p>
    </div>
  `;

  if (!apiKey || !to || !from) {
    console.error(
      `[Plan inquiry] Missing Resend env: ${missing.join(", ")}. Add them to .env.local or host env.`,
    );
    return {
      ok: false,
      message:
        process.env.NODE_ENV === "development"
          ? `Email not configured yet — add to .env.local: ${missing.join(", ")}.`
          : "We couldn't submit your request right now. Please try again or reach us on WhatsApp.",
    };
  }

  const resend = new Resend(apiKey);

  try {
    const ownerSend = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `[Balanced Bites] Custom plan inquiry — ${fullName}`,
      text: textBody,
      html: htmlBody,
    });
    if (ownerSend.error) {
      console.error("Resend API error (plan inquiry owner):", ownerSend.error);
      return {
        ok: false,
        message:
          "We couldn't send your request. Please try again or reach us on WhatsApp.",
      };
    }

    const visitorHtml = `
      <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:32rem">
        <p>Hi ${escapeHtml(fullName)},</p>
        <p>Thanks for reaching out to <strong style="color:#426237">Balanced Bites</strong>. We've received your request for a custom eating plan and our nutritionist will get back to you shortly with next steps and pricing for the plan that fits you best.</p>
        <p>If anything is urgent, feel free to reply to this email or message us on WhatsApp.</p>
        <p style="margin-top:1.75rem;color:#426237">Warmly,<br />The Balanced Bites team</p>
      </div>
    `;
    const visitorSend = await resend.emails.send({
      from,
      to: [email],
      replyTo: to,
      subject: "We received your plan inquiry — Balanced Bites",
      html: visitorHtml,
      text: `Hi ${fullName},\n\nThanks for reaching out to Balanced Bites. We've received your request for a custom eating plan and our nutritionist will get back to you shortly.\n\nWarmly,\nThe Balanced Bites team`,
    });
    if (visitorSend.error) {
      console.error("Resend API error (plan inquiry visitor):", visitorSend.error);
    }
  } catch (err) {
    console.error("Plan inquiry send failed:", err);
    return {
      ok: false,
      message:
        "We couldn't send your request. Please try again or reach us on WhatsApp.",
    };
  }

  return {
    ok: true,
    message:
      "Thanks! We've received your request and will be in touch by email soon with pricing and the plan that fits you best.",
  };
}
