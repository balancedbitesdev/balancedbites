"use client";

import Link from "next/link";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { InlineSpinner } from "@/components/balanced-bites/InlineSpinner";
import { useLocale } from "@/components/balanced-bites/LocaleContext";
import Stepper, { Step } from "@/components/reactbits/Stepper";
import { localeDir, type Locale } from "@/lib/i18n";
import { submitPlanInquiry, type PlanInquiryResult } from "./actions";

type Props = {
  initialTier?: string;
};

const INITIAL_STATE: PlanInquiryResult = {
  ok: false,
  message: "",
};

const WHATSAPP_E164 = process.env.NEXT_PUBLIC_WHATSAPP_E164 ?? "201000000000";
const WHATSAPP_DIGITS = WHATSAPP_E164.replace(/\D/g, "");

const FIELD_CLASS =
  "mt-2 w-full rounded-xl border border-[#426237]/15 bg-[#f4f1eb] px-4 py-3 text-sm text-[#426237] outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-[#426237]/25 focus:ring-2 focus:ring-[#426237]/30";

const FIELD_LTR_CLASS = `${FIELD_CLASS} text-start [unicode-bidi:plaintext]`;

const TIERS: { id: string; badge: string; title: string; subtitle: string }[] =
  [
    {
      id: "Starter (1 month)",
      badge: "Starter",
      title: "1 month",
      subtitle: "Try a plan with nutritionist support.",
    },
    {
      id: "Committed (3 months)",
      badge: "Committed",
      title: "3 months",
      subtitle: "Steady results with monthly check-ins.",
    },
    {
      id: "Transform (6 months)",
      badge: "Transform",
      title: "6 months",
      subtitle: "Deep support for a full transformation.",
    },
  ];

const FORM_COPY = {
  en: {
    thanks: "Thanks for reaching out",
    touch: "We'll be in touch",
    faster: "Want a faster reply?",
    fasterBody:
      "Send your details to us on WhatsApp - we'll open the chat pre-filled with everything you just shared.",
    sendWhatsapp: "Send my details on WhatsApp",
    whatsappNote: "Opens WhatsApp with your answers ready to send - no typing needed.",
    backContact: "Back to contact info",
    requestPlan: "Request my plan",
    step: "Step",
    detailsTitle: "Your details",
    detailsSub: "So we know how to reach you.",
    fullName: "Full name",
    email: "Email",
    phone: "Phone (WhatsApp preferred)",
    aboutTitle: "A little about you",
    aboutSub: "Optional, but it helps us tailor your plan.",
    age: "Age",
    gender: "Gender",
    preferNot: "Prefer not to say",
    female: "Female",
    male: "Male",
    other: "Other",
    weight: "Weight (kg)",
    height: "Height (cm)",
    activity: "Activity level",
    low: "Low - mostly sedentary",
    moderate: "Moderate - some exercise weekly",
    high: "High - regular training",
    goalTitle: "Your goal",
    goalSub: "What would you like your plan to help with?",
    mainGoal: "Main goal",
    selectGoal: "Select a goal",
    diet: "Diet preference",
    noPreference: "No strong preference",
    allergies: "Any allergies or intolerances?",
    allergyPlaceholder: "e.g. Nuts, dairy, shellfish",
    planTitle: "Which plan fits best?",
    planSub: "Pick a starting point - we'll confirm pricing when we reach out.",
    unsure:
      "Not sure yet? Leave blank - our nutritionist will recommend the right fit when we reach out.",
    anything: "Anything else? (optional)",
    notesPlaceholder:
      "Sleep, stress, training schedule, medical conditions - anything that helps us design the right plan.",
    sendingRequest: "Sending your request...",
    privacy:
      "Your details are only used by our nutritionist to prepare your plan. We'll never share them.",
  },
  ar: {
    thanks: "شكرًا إنك تواصلت معانا",
    touch: "هنرد عليك قريب",
    faster: "عايز رد أسرع؟",
    fasterBody:
      "ابعت تفاصيلك على واتساب - هنفتحلك الشات وفيه كل اللي كتبته جاهز للإرسال.",
    sendWhatsapp: "ابعت تفاصيلك على واتساب",
    whatsappNote: "واتساب هيفتح بإجاباتك جاهزة - من غير ما تكتب تاني.",
    backContact: "ارجع لمعلومات التواصل",
    requestPlan: "اطلب الخطة",
    step: "خطوة",
    detailsTitle: "بياناتك",
    detailsSub: "عشان نعرف نوصلك.",
    fullName: "الاسم بالكامل",
    email: "الإيميل",
    phone: "الموبايل (واتساب أفضل)",
    aboutTitle: "شوية معلومات عنك",
    aboutSub: "اختياري، بس بيساعدنا نظبط الخطة عليك.",
    age: "السن",
    gender: "النوع",
    preferNot: "مش حابب أقول",
    female: "أنثى",
    male: "ذكر",
    other: "آخر",
    weight: "الوزن (كجم)",
    height: "الطول (سم)",
    activity: "مستوى الحركة",
    low: "قليل - أغلب اليوم قعدة",
    moderate: "متوسط - تمرين كام مرة في الأسبوع",
    high: "عالي - تمرين منتظم",
    goalTitle: "هدفك",
    goalSub: "عايز الخطة تساعدك في إيه؟",
    mainGoal: "الهدف الأساسي",
    selectGoal: "اختار هدف",
    diet: "تفضيل الأكل",
    noPreference: "مفيش تفضيل قوي",
    allergies: "في أي حساسية أو عدم تحمل؟",
    allergyPlaceholder: "مثلاً: مكسرات، لبن، جمبري",
    planTitle: "أنهي خطة أنسب لك؟",
    planSub: "اختار بداية - وهنأكد السعر لما نتواصل معاك.",
    unsure: "مش متأكد؟ سيبها فاضية - أخصائية التغذية هترشحلك الأنسب.",
    anything: "أي حاجة تانية؟ (اختياري)",
    notesPlaceholder:
      "نوم، ضغط، مواعيد تمرين، حالات صحية - أي حاجة تساعدنا نصمم الخطة صح.",
    sendingRequest: "بنبعت طلبك...",
    privacy: "بياناتك بتستخدم بس لتحضير خطتك مع أخصائية التغذية. مش هنشاركها مع حد.",
  },
} as const;

type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  weightKg: string;
  heightCm: string;
  activityLevel: string;
  goal: string;
  dietPreference: string;
  allergies: string;
  preferredTier: string;
  notes: string;
};

const INITIAL_VALUES: FormValues = {
  fullName: "",
  email: "",
  phone: "",
  age: "",
  gender: "",
  weightKg: "",
  heightCm: "",
  activityLevel: "",
  goal: "",
  dietPreference: "",
  allergies: "",
  preferredTier: "",
  notes: "",
};

function buildWhatsAppMessage(d: FormValues, locale: Locale): string {
  const ar = locale === "ar";
  const c = FORM_COPY[locale];
  const lines: string[] = [
    ar
      ? "أهلاً Balanced Bites! أنا لسه بعت فورم الخطة المخصصة. دي تفاصيلي:"
      : "Hi Balanced Bites! I just submitted the custom plan form. Here are my details:",
    "",
  ];

  const contact: string[] = [];
  if (d.fullName) contact.push(`${ar ? "الاسم" : "Name"}: ${d.fullName}`);
  if (d.email) contact.push(`${ar ? "الإيميل" : "Email"}: ${d.email}`);
  if (d.phone) contact.push(`${ar ? "الموبايل" : "Phone"}: ${d.phone}`);
  if (contact.length) lines.push(...contact, "");

  const about: string[] = [];
  if (d.age) about.push(`${ar ? "السن" : "Age"}: ${d.age}`);
  if (d.gender) {
    const gLabel =
      d.gender === "female"
        ? c.female
        : d.gender === "male"
          ? c.male
          : d.gender === "other"
            ? c.other
            : d.gender;
    about.push(`${ar ? "النوع" : "Gender"}: ${gLabel}`);
  }
  if (d.weightKg) about.push(`${ar ? "الوزن" : "Weight"}: ${d.weightKg} kg`);
  if (d.heightCm) about.push(`${ar ? "الطول" : "Height"}: ${d.heightCm} cm`);
  if (d.activityLevel) {
    const actLabel =
      d.activityLevel === "low"
        ? c.low
        : d.activityLevel === "moderate"
          ? c.moderate
          : d.activityLevel === "high"
            ? c.high
            : d.activityLevel;
    about.push(
      `${ar ? "مستوى الحركة" : "Activity level"}: ${actLabel}`,
    );
  }
  if (about.length) lines.push(...about, "");

  const goals: string[] = [];
  if (d.goal) goals.push(`${ar ? "الهدف" : "Goal"}: ${d.goal}`);
  if (d.dietPreference) goals.push(`${ar ? "تفضيل الأكل" : "Diet preference"}: ${d.dietPreference}`);
  if (d.allergies) goals.push(`${ar ? "الحساسية" : "Allergies"}: ${d.allergies}`);
  if (goals.length) lines.push(...goals, "");

  if (d.preferredTier) {
    lines.push(`${ar ? "الخطة المفضلة" : "Preferred plan"}: ${d.preferredTier}`, "");
  }

  if (d.notes) {
    lines.push(ar ? "ملاحظات:" : "Notes:", d.notes);
  }

  return lines.join("\n").trim();
}

function buildWhatsAppUrl(d: FormValues, locale: Locale): string {
  return `https://wa.me/${WHATSAPP_DIGITS}?text=${encodeURIComponent(
    buildWhatsAppMessage(d, locale),
  )}`;
}

export function PlanInquiryForm({ initialTier }: Props) {
  const { locale } = useLocale();
  const c = FORM_COPY[locale];
  const [values, setValues] = useState<FormValues>(() => ({
    ...INITIAL_VALUES,
    preferredTier: initialTier ?? "",
  }));
  const [submitted, setSubmitted] = useState<FormValues | null>(null);
  const snapshotRef = useRef<FormValues>(INITIAL_VALUES);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const [state, formAction, pending] = useActionState<
    PlanInquiryResult,
    FormData
  >(submitPlanInquiry, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) {
      setSubmitted(snapshotRef.current);
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [state.ok]);

  const update =
    <K extends keyof FormValues>(key: K) =>
    (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
    };

  const submit = () => {
    const snapshot: FormValues = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      age: values.age.trim(),
      gender: values.gender.trim(),
      weightKg: values.weightKg.trim(),
      heightCm: values.heightCm.trim(),
      activityLevel: values.activityLevel.trim(),
      goal: values.goal.trim(),
      dietPreference: values.dietPreference.trim(),
      allergies: values.allergies.trim(),
      preferredTier: values.preferredTier.trim(),
      notes: values.notes.trim(),
    };
    snapshotRef.current = snapshot;

    const fd = new FormData();
    (Object.keys(snapshot) as Array<keyof FormValues>).forEach((k) => {
      fd.set(k, snapshot[k]);
    });

    startTransition(() => {
      formAction(fd);
    });
  };

  if (state.ok) {
    const whatsappUrl = submitted ? buildWhatsAppUrl(submitted, locale) : null;
    return (
      <div
        ref={resultsRef}
        dir={localeDir(locale)}
        lang={locale === "ar" ? "ar-EG" : "en"}
        className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6"
      >
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl ring-1 ring-[#426237]/10 sm:p-12">
          <div
            aria-hidden
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#426237]/10 text-[#426237]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
              <path
                d="m5 12 5 5 9-10"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="menu-script mt-4 text-lg text-[#426237] sm:text-xl">
            {c.thanks}
          </p>
          <h2 className="menu-serif mt-2 text-3xl font-bold tracking-tight text-[#426237] sm:text-4xl">
            {c.touch}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-gray-600">
            {state.message}
          </p>

          {whatsappUrl ? (
            <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-[#426237]/12 bg-[#f4f1eb]/70 p-5 text-start">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ac8058]">
                {c.faster}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {c.fasterBody}
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 ease-out hover:bg-[#1ebe5a] active:scale-[0.98]"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="h-4 w-4"
                  fill="currentColor"
                >
                  <path d="M19.05 4.91A10 10 0 0 0 2.1 17l-1.1 4 4.1-1.07A10 10 0 1 0 19.05 4.9Zm-7 15.18a8.3 8.3 0 0 1-4.24-1.16l-.3-.18-2.43.64.65-2.37-.2-.31a8.31 8.31 0 1 1 15.4-4.36 8.3 8.3 0 0 1-8.88 7.74Zm4.78-6.23c-.26-.13-1.55-.77-1.8-.86-.24-.09-.42-.13-.6.13-.18.26-.67.86-.83 1.04-.15.18-.3.2-.57.07-.26-.13-1.11-.41-2.11-1.3a7.9 7.9 0 0 1-1.47-1.83c-.15-.26-.02-.4.11-.53.12-.12.26-.3.38-.45.13-.15.17-.26.26-.43.09-.18.04-.33-.02-.46-.06-.13-.57-1.38-.78-1.9-.2-.49-.4-.42-.57-.43h-.49c-.17 0-.46.07-.7.33-.24.26-.93.91-.93 2.21 0 1.3.95 2.55 1.08 2.73.13.17 1.86 2.86 4.5 4 .63.27 1.12.43 1.5.55.63.2 1.2.17 1.65.1.5-.07 1.55-.63 1.76-1.24.22-.62.22-1.15.15-1.26-.06-.1-.24-.16-.5-.29Z" />
                </svg>
                {c.sendWhatsapp}
              </a>
              <p className="mt-3 text-[11px] text-gray-500">
                {c.whatsappNote}
              </p>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/menu"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#426237] px-10 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2c4224] active:scale-[0.98]"
            >
              {locale === "ar" ? "شوف المنيو" : "Browse the menu"}
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-[#426237] underline decoration-[#426237]/30 underline-offset-4 transition-colors hover:text-[#2c4224]"
            >
              {c.backContact}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={localeDir(locale)}
      lang={locale === "ar" ? "ar-EG" : "en"}
      className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10"
    >
      <Stepper
        footerDir="ltr"
        nextButtonText={pending ? c.sendingRequest : locale === "ar" ? "كمّل" : "Continue"}
        completeButtonText={pending ? c.sendingRequest : c.requestPlan}
        backButtonText={locale === "ar" ? "رجوع" : "Back"}
        nextButtonProps={{ disabled: pending, "aria-busy": pending }}
        backButtonProps={{ disabled: pending }}
        disableStepIndicators={pending}
        onFinalStepCompleted={submit}
      >
        <Step>
          <StepHeader
            kicker={`${c.step} 01`}
            title={c.detailsTitle}
            subtitle={c.detailsSub}
          />
          <div className="mt-6 space-y-4">
            <Row>
              <Field label={c.fullName} required>
                <input
                  type="text"
                  name="fullName"
                  value={values.fullName}
                  onChange={update("fullName")}
                  autoComplete="name"
                  className={FIELD_CLASS}
                />
              </Field>
              <Field label={c.email} required>
                <input
                  type="email"
                  name="email"
                  value={values.email}
                  onChange={update("email")}
                  autoComplete="email"
                  dir="ltr"
                  className={FIELD_LTR_CLASS}
                />
              </Field>
            </Row>
            <Field label={c.phone}>
              <input
                type="tel"
                name="phone"
                value={values.phone}
                onChange={update("phone")}
                autoComplete="tel"
                dir="ltr"
                className={FIELD_LTR_CLASS}
              />
            </Field>
          </div>
        </Step>

        <Step>
          <StepHeader
            kicker={`${c.step} 02`}
            title={c.aboutTitle}
            subtitle={c.aboutSub}
          />
          <div className="mt-6 space-y-4">
            <Row>
              <Field label={c.age}>
                <input
                  type="number"
                  name="age"
                  value={values.age}
                  onChange={update("age")}
                  inputMode="numeric"
                  min={12}
                  max={110}
                  placeholder="e.g. 30"
                  className={FIELD_CLASS}
                />
              </Field>
              <Field label={c.gender}>
                <select
                  name="gender"
                  value={values.gender}
                  onChange={update("gender")}
                  className={FIELD_CLASS}
                >
                  <option value="">{c.preferNot}</option>
                  <option value="female">{c.female}</option>
                  <option value="male">{c.male}</option>
                  <option value="other">{c.other}</option>
                </select>
              </Field>
            </Row>
            <Row>
              <Field label={c.weight}>
                <input
                  type="number"
                  name="weightKg"
                  value={values.weightKg}
                  onChange={update("weightKg")}
                  inputMode="decimal"
                  step={0.1}
                  min={30}
                  max={250}
                  placeholder="e.g. 70"
                  className={FIELD_CLASS}
                />
              </Field>
              <Field label={c.height}>
                <input
                  type="number"
                  name="heightCm"
                  value={values.heightCm}
                  onChange={update("heightCm")}
                  inputMode="decimal"
                  step={0.5}
                  min={120}
                  max={230}
                  placeholder="e.g. 170"
                  className={FIELD_CLASS}
                />
              </Field>
            </Row>
            <Field label={c.activity}>
              <select
                name="activityLevel"
                value={values.activityLevel}
                onChange={update("activityLevel")}
                className={FIELD_CLASS}
              >
                <option value="">{c.preferNot}</option>
                <option value="low">{c.low}</option>
                <option value="moderate">{c.moderate}</option>
                <option value="high">{c.high}</option>
              </select>
            </Field>
          </div>
        </Step>

        <Step>
          <StepHeader
            kicker={`${c.step} 03`}
            title={c.goalTitle}
            subtitle={c.goalSub}
          />
          <div className="mt-6 space-y-4">
            <Field label={c.mainGoal}>
              <select
                name="goal"
                value={values.goal}
                onChange={update("goal")}
                className={FIELD_CLASS}
              >
                <option value="">{c.selectGoal}</option>
                <option value="Fat loss">{locale === "ar" ? "خسارة دهون" : "Fat loss"}</option>
                <option value="Muscle gain">{locale === "ar" ? "زيادة عضل" : "Muscle gain"}</option>
                <option value="Recomposition">{locale === "ar" ? "إعادة تشكيل الجسم" : "Recomposition"}</option>
                <option value="Maintenance / healthy habits">
                  {locale === "ar" ? "ثبات / عادات صحية" : "Maintenance / healthy habits"}
                </option>
                <option value="Hormone balance">{locale === "ar" ? "توازن الهرمونات" : "Hormone balance"}</option>
                <option value="Medical-driven (PCOS, thyroid, diabetes…)">
                  {locale === "ar" ? "حالة صحية (تكيس، غدة، سكر...)" : "Medical-driven (PCOS, thyroid, diabetes...)"}
                </option>
              </select>
            </Field>
            <Field label={c.diet}>
              <select
                name="dietPreference"
                value={values.dietPreference}
                onChange={update("dietPreference")}
                className={FIELD_CLASS}
              >
                <option value="">{c.noPreference}</option>
                <option value="Clean eating / balanced">
                  {locale === "ar" ? "أكل نضيف / متوازن" : "Clean eating / balanced"}
                </option>
                <option value="Keto">Keto</option>
                <option value="Low carb">{locale === "ar" ? "كارب قليل" : "Low carb"}</option>
                <option value="High protein">{locale === "ar" ? "بروتين عالي" : "High protein"}</option>
                <option value="Vegetarian">{locale === "ar" ? "نباتي" : "Vegetarian"}</option>
                <option value="Other">{locale === "ar" ? "أخرى - هوضح في الملاحظات" : "Other - I'll explain in notes"}</option>
              </select>
            </Field>
            <Field label={c.allergies}>
              <textarea
                name="allergies"
                rows={2}
                value={values.allergies}
                onChange={update("allergies")}
                placeholder={c.allergyPlaceholder}
                className={FIELD_CLASS}
              />
            </Field>
          </div>
        </Step>

        <Step>
          <StepHeader
            kicker={`${c.step} 04`}
            title={c.planTitle}
            subtitle={c.planSub}
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {TIERS.map((t, index) => {
              const isOn = values.preferredTier === t.id;
              const arTier =
                index === 0
                  ? { badge: "بداية", title: "شهر", subtitle: "جرّب خطة بدعم من أخصائية التغذية." }
                  : index === 1
                    ? { badge: "التزام", title: "٣ شهور", subtitle: "نتايج ثابتة مع متابعة شهرية." }
                    : { badge: "تحول", title: "٦ شهور", subtitle: "دعم كامل لتحول طويل المدى." };
              const tierCopy = locale === "ar" ? arTier : t;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setValues((v) => ({ ...v, preferredTier: t.id }))
                  }
                  className={`rounded-2xl border px-4 py-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/35 ${
                    isOn
                      ? "border-[#426237] bg-[#426237]/5 shadow-[0_12px_32px_-22px_rgba(66,98,55,0.5)]"
                      : "border-[#426237]/15 bg-[#f4f1eb]/50 hover:border-[#426237]/30 hover:bg-white"
                  }`}
                  aria-pressed={isOn}
                >
                  <p
                    className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
                      isOn ? "text-[#ac8058]" : "text-[#ac8058]/80"
                    }`}
                  >
                    {tierCopy.badge}
                  </p>
                  <p className="menu-serif mt-2 text-lg font-semibold text-[#426237]">
                    {tierCopy.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">{tierCopy.subtitle}</p>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            {c.unsure}
          </p>

          <div className="mt-6">
            <Field label={c.anything}>
              <textarea
                name="notes"
                rows={4}
                value={values.notes}
                onChange={update("notes")}
                placeholder={c.notesPlaceholder}
                className={FIELD_CLASS}
              />
            </Field>
          </div>

          {!state.ok && state.message.length > 0 ? (
            <p
              className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"
              role="status"
            >
              {state.message}
            </p>
          ) : null}

          {pending ? (
            <p
              className="mt-4 flex items-center justify-center gap-2 text-xs text-[#426237]/70"
              role="status"
            >
              <InlineSpinner />
              <span>{c.sendingRequest}</span>
            </p>
          ) : null}
        </Step>
      </Stepper>

      <p className="mt-6 text-center text-xs text-[#426237]/55">
        {c.privacy}
      </p>
    </div>
  );
}

function StepHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ac8058]">
        {kicker}
      </p>
      <h2 className="menu-serif mt-2 text-xl font-semibold text-[#426237] sm:text-2xl">
        {title}
      </h2>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block text-start">
      <span className="block text-sm font-semibold text-[#426237]">
        {label}
        {required ? <span className="ms-0.5 text-[#ac8058]">*</span> : null}
      </span>
      {children}
    </label>
  );
}
