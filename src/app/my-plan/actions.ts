"use server";

import { Resend } from "resend";
import { normalizeLocale } from "@/lib/i18n";

export type PlanInquiryResult = {
  ok: boolean;
  message: string;
  /** True when the email could not be delivered — client should offer WhatsApp. */
  whatsappFallback?: boolean;
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
  const locale = normalizeLocale(String(formData.get("locale") ?? ""));
  const ar = locale === "ar";

  const fullName = get("fullName");
  const age = get("age");
  const gender = get("gender");
  const email = get("email");
  const phone = get("phone");

  const weightKg = get("weightKg");
  const heightCm = get("heightCm");
  const bodyFatPct = get("bodyFatPct");

  const activityLevel = get("activityLevel");
  const workType = get("workType");

  const goal = get("goal");
  const targetWeightKg = get("targetWeightKg");

  const medicalConditions = get("medicalConditions");
  const dietPreference = get("dietPreference");
  const allergies = get("allergies");
  const dislikedFoods = get("dislikedFoods");

  const mealsPerDay = get("mealsPerDay");
  const sugarCravings = get("sugarCravings");
  const lateNightEating = get("lateNightEating");

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
    "1. PERSONAL INFORMATION",
    `  Full name: ${fullName}`,
    `  Age: ${age || "(not provided)"}`,
    `  Gender: ${gender || "(not provided)"}`,
    `  Email: ${email}`,
    `  Phone: ${phone || "(not provided)"}`,
    "",
    "2. BODY DETAILS",
    `  Weight: ${weightKg ? `${weightKg} kg` : "(not provided)"}`,
    `  Height: ${heightCm ? `${heightCm} cm` : "(not provided)"}`,
    `  Body Fat %: ${bodyFatPct ? `${bodyFatPct}%` : "(optional)"}`,
    "",
    "3. LIFESTYLE",
    `  Activity level: ${activityLevel || "(not provided)"}`,
    `  Work type: ${workType || "(not provided)"}`,
    "",
    "4. GOALS",
    `  Goal: ${goal || "(not provided)"}`,
    `  Target weight: ${targetWeightKg ? `${targetWeightKg} kg` : "(optional)"}`,
    "",
    "5. HEALTH & PREFERENCES",
    `  Medical conditions: ${medicalConditions || "(none)"}`,
    `  Diet preference: ${dietPreference || "(none)"}`,
    `  Allergies / intolerances: ${allergies || "(none)"}`,
    `  Disliked foods: ${dislikedFoods || "(none)"}`,
    "",
    "6. EATING HABITS",
    `  Meals per day: ${mealsPerDay || "(not provided)"}`,
    `  Sugar/carb cravings: ${sugarCravings || "(not provided)"}`,
    `  Late night eating: ${lateNightEating || "(not provided)"}`,
    "",
    "7. ADDITIONAL NOTES",
    `  ${notes || "(none)"}`,
  ];

  const textBody = textSections.join("\n");

  const htmlRows: string[] = [];
  const row = (label: string, value: string) =>
    htmlRows.push(
      `<tr><td style="padding:6px 14px 6px 0;color:#6b5b4d;font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;color:#1f2937;font-size:13px">${escapeHtml(value)}</td></tr>`,
    );

  row("Full name", fullName);
  row("Age", age || "(not provided)");
  row("Gender", gender || "(not provided)");
  row("Email", email);
  row("Phone", phone || "(not provided)");
  row("Weight", weightKg ? `${weightKg} kg` : "(not provided)");
  row("Height", heightCm ? `${heightCm} cm` : "(not provided)");
  row("Body Fat %", bodyFatPct ? `${bodyFatPct}%` : "(optional)");
  row("Activity level", activityLevel || "(not provided)");
  row("Work type", workType || "(not provided)");
  row("Goal", goal || "(not provided)");
  row("Target weight", targetWeightKg ? `${targetWeightKg} kg` : "(optional)");
  row("Medical conditions", medicalConditions || "(none)");
  row("Diet preference", dietPreference || "(none)");
  row("Allergies / intolerances", allergies || "(none)");
  row("Disliked foods", dislikedFoods || "(none)");
  row("Meals per day", mealsPerDay || "(not provided)");
  row("Sugar/carb cravings", sugarCravings || "(not provided)");
  row("Late night eating", lateNightEating || "(not provided)");
  row("Additional notes", notes || "(none)");

  const htmlBody = `
    <div style="font-family:system-ui,-apple-system,sans-serif;color:#1f2937">
      <h2 style="margin:0 0 16px;color:#426237;font-size:18px">New Personalized Diet Plan Request — ${escapeHtml(fullName)}</h2>
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
      whatsappFallback: true,
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
        whatsappFallback: true,
        message:
          "We couldn't send your request. Please try again or reach us on WhatsApp.",
      };
    }

    const notProvided = ar ? "غير محدد" : "(not provided)";
    const optionalNone = ar ? "لا يوجد" : "(none)";
    const optionalText = ar ? "اختياري" : "(optional)";

    const visitorTextSections: string[] = [
      ar ? `أهلاً ${fullName}،` : `Hi ${fullName},`,
      "",
      ar
        ? "شكراً لتواصلك مع Balanced Bites. استلمنا طلبك لخطة التغذية المخصصة وأخصائي التغذية هيراجع تفاصيلك ويتواصل معاك في أقرب وقت بالخطوات والأسعار المناسبة ليك."
        : "Thanks for reaching out to Balanced Bites. We've received your request for a custom eating plan and our nutritionist will get back to you shortly with next steps and pricing for the plan that fits you best.",
      "",
      ar
        ? "فيما يلي ملخص البيانات التي قمت بإرسالها للمراجعة والتأكيد:"
        : "Here is a copy of your submitted answers for your reference:",
      "",
      `1. ${ar ? "البيانات الشخصية" : "Personal Information"}`,
      `  ${ar ? "الاسم" : "Full name"}: ${fullName}`,
      `  ${ar ? "السن" : "Age"}: ${age || notProvided}`,
      `  ${ar ? "النوع" : "Gender"}: ${gender || notProvided}`,
      `  ${ar ? "الإيميل" : "Email"}: ${email}`,
      `  ${ar ? "الموبايل" : "Phone"}: ${phone || notProvided}`,
      "",
      `2. ${ar ? "تفاصيل الجسم" : "Body Details"}`,
      `  ${ar ? "الوزن" : "Weight"}: ${weightKg ? `${weightKg} kg` : notProvided}`,
      `  ${ar ? "الطول" : "Height"}: ${heightCm ? `${heightCm} cm` : notProvided}`,
      `  ${ar ? "نسبة الدهون" : "Body Fat %"}: ${bodyFatPct ? `${bodyFatPct}%` : optionalText}`,
      "",
      `3. ${ar ? "نمط الحياة" : "Lifestyle"}`,
      `  ${ar ? "مستوى النشاط" : "Activity level"}: ${activityLevel || notProvided}`,
      `  ${ar ? "طبيعة العمل" : "Work type"}: ${workType || notProvided}`,
      "",
      `4. ${ar ? "الأهداف" : "Goals"}`,
      `  ${ar ? "الهدف" : "Goal"}: ${goal || notProvided}`,
      `  ${ar ? "الوزن المستهدف" : "Target weight"}: ${targetWeightKg ? `${targetWeightKg} kg` : optionalText}`,
      "",
      `5. ${ar ? "الصحة والتفضيلات" : "Health & Preferences"}`,
      `  ${ar ? "الحالات الصحية" : "Medical conditions"}: ${medicalConditions || optionalNone}`,
      `  ${ar ? "النظام الغذائي" : "Diet preference"}: ${dietPreference || optionalNone}`,
      `  ${ar ? "الحساسية الغذائية" : "Allergies / intolerances"}: ${allergies || optionalNone}`,
      `  ${ar ? "أطعمة غير مفضلة" : "Disliked foods"}: ${dislikedFoods || optionalNone}`,
      "",
      `6. ${ar ? "عادات الأكل" : "Eating Habits"}`,
      `  ${ar ? "عدد الوجبات" : "Meals per day"}: ${mealsPerDay || notProvided}`,
      `  ${ar ? "اشتهاء السكريات" : "Sugar/carb cravings"}: ${sugarCravings || notProvided}`,
      `  ${ar ? "الأكل ليلاً" : "Late night eating"}: ${lateNightEating || notProvided}`,
      "",
      `7. ${ar ? "ملاحظات إضافية" : "Additional Notes"}`,
      `  ${notes || optionalNone}`,
      "",
      ar
        ? "لو حابب تعدل أي بيانات أو عندك أي استفسار، تقدر ترد على الإيميل ده أو تكلمنا على واتساب."
        : "If anything needs updating or if you have any questions, feel free to reply directly to this email or message us on WhatsApp.",
      "",
      ar ? "مع أطيب التحيات،\nفريق Balanced Bites" : "Warmly,\nThe Balanced Bites team",
    ];

    const visitorRows: string[] = [];
    const vRow = (label: string, value: string) => {
      visitorRows.push(
        `<tr><td style="padding:6px 10px 6px 0;color:#6b5b4d;font-weight:600;font-size:13px;white-space:nowrap;vertical-align:top;border-bottom:1px solid rgba(66,98,55,0.08)">${escapeHtml(
          label,
        )}</td><td style="padding:6px 0 6px 10px;color:#1f2937;font-size:13px;border-bottom:1px solid rgba(66,98,55,0.08)">${escapeHtml(
          value,
        )}</td></tr>`,
      );
    };

    vRow(ar ? "الاسم" : "Full name", fullName);
    vRow(ar ? "السن" : "Age", age || notProvided);
    vRow(ar ? "النوع" : "Gender", gender || notProvided);
    vRow(ar ? "الإيميل" : "Email", email);
    vRow(ar ? "الموبايل" : "Phone", phone || notProvided);
    vRow(ar ? "الوزن" : "Weight", weightKg ? `${weightKg} kg` : notProvided);
    vRow(ar ? "الطول" : "Height", heightCm ? `${heightCm} cm` : notProvided);
    vRow(ar ? "نسبة الدهون" : "Body Fat %", bodyFatPct ? `${bodyFatPct}%` : optionalText);
    vRow(ar ? "مستوى النشاط" : "Activity level", activityLevel || notProvided);
    vRow(ar ? "طبيعة العمل" : "Work type", workType || notProvided);
    vRow(ar ? "الهدف" : "Goal", goal || notProvided);
    vRow(ar ? "الوزن المستهدف" : "Target weight", targetWeightKg ? `${targetWeightKg} kg` : optionalText);
    vRow(ar ? "الحالات الصحية" : "Medical conditions", medicalConditions || optionalNone);
    vRow(ar ? "النظام الغذائي" : "Diet preference", dietPreference || optionalNone);
    vRow(ar ? "الحساسية الغذائية" : "Allergies / intolerances", allergies || optionalNone);
    vRow(ar ? "أطعمة غير مفضلة" : "Disliked foods", dislikedFoods || optionalNone);
    vRow(ar ? "عدد الوجبات" : "Meals per day", mealsPerDay || notProvided);
    vRow(ar ? "اشتهاء السكريات" : "Sugar/carb cravings", sugarCravings || notProvided);
    vRow(ar ? "الأكل ليلاً" : "Late night eating", lateNightEating || notProvided);
    vRow(ar ? "ملاحظات إضافية" : "Additional notes", notes || optionalNone);

    const summaryTitle = ar
      ? "تفاصيل طلب خطتك للمراجعة والتأكيد"
      : "Your submitted plan details for review";

    const visitorHtml = `
      <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#1f2937;max-width:38rem;direction:${ar ? "rtl" : "ltr"}">
        <p style="margin:0 0 12px">${ar ? `أهلاً ${escapeHtml(fullName)}،` : `Hi ${escapeHtml(fullName)},`}</p>
        <p style="margin:0 0 16px">${
          ar
            ? `شكراً لتواصلك مع <strong style="color:#426237">Balanced Bites</strong>. استلمنا طلبك لخطة التغذية المخصصة وأخصائي التغذية هيراجع تفاصيلك ويتواصل معاك في أقرب وقت بالخطوات والأسعار المناسبة ليك.`
            : `Thanks for reaching out to <strong style="color:#426237">Balanced Bites</strong>. We've received your request for a custom eating plan and our nutritionist will get back to you shortly with next steps and pricing for the plan that fits you best.`
        }</p>
        <div style="margin:20px 0;padding:16px;background-color:#f4f1eb;border-radius:12px;border:1px solid rgba(66,98,55,0.15)">
          <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#ac8058">${summaryTitle}</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;line-height:1.55;margin:0">
            <tbody>${visitorRows.join("")}</tbody>
          </table>
        </div>
        <p style="margin:16px 0 0;font-size:13px;color:#6b7280">${
          ar
            ? "لو حابب تعدل أي بيانات أو عندك أي استفسار، تقدر ترد مباشرة على الإيميل ده أو تكلمنا على واتساب."
            : "If anything needs updating or if you have any questions, feel free to reply directly to this email or message us on WhatsApp."
        }</p>
        <p style="margin:20px 0 0;color:#426237;font-weight:600">${
          ar ? "مع أطيب التحيات،<br />فريق Balanced Bites" : "Warmly,<br />The Balanced Bites team"
        }</p>
      </div>
    `;
    const visitorSubject = ar
      ? "استلمنا طلب خطتك الغذائية — Balanced Bites"
      : "We received your plan inquiry — Balanced Bites";

    const visitorSend = await resend.emails.send({
      from,
      to: [email],
      replyTo: to,
      subject: visitorSubject,
      html: visitorHtml,
      text: visitorTextSections.join("\n"),
    });

    if (visitorSend.error) {
      console.error("Resend API error (plan inquiry visitor):", visitorSend.error);
    }
  } catch (err) {
    console.error("Plan inquiry send failed:", err);
    return {
      ok: false,
      whatsappFallback: true,
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
