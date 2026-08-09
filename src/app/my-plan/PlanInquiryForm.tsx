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
  "box-border mt-2 min-h-11 min-w-0 max-w-full w-full rounded-xl border border-[#426237]/15 bg-[#f4f1eb] px-4 py-3 text-sm text-[#426237] outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-[#426237]/25 focus:ring-2 focus:ring-[#426237]/30";

const FIELD_LTR_CLASS = `${FIELD_CLASS} text-start`;

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
    requestPlan: "Get My Plan",
    step: "Step",
    sendingRequest: "Submitting your plan request...",
    
    // Step 1: Personal Information
    step1Title: "Personal Information",
    step1Sub: "Enter your basic contact details.",
    fullName: "Full Name",
    age: "Age",
    gender: "Gender",
    female: "Female",
    male: "Male",
    email: "Email",
    phone: "Phone (WhatsApp preferred)",

    // Step 2: Body Details
    step2Title: "Body Details",
    step2Sub: "Helps us calculate your macro and calorie needs.",
    weightKg: "Weight (kg)",
    heightCm: "Height (cm)",
    bodyFatPct: "Body Fat % (optional)",

    // Step 3: Lifestyle
    step3Title: "Lifestyle",
    step3Sub: "Tell us about your daily activity and work routine.",
    activityLevel: "Activity Level",
    lowActivity: "Low (mostly sedentary)",
    modActivity: "Moderate (some exercise weekly)",
    highActivity: "High (regular training)",
    workType: "Work Type",
    deskWork: "Desk work",
    activeWork: "Active work",
    athleteWork: "Athlete / Heavy physical",

    // Step 4: Goals
    step4Title: "Goals",
    step4Sub: "What would you like your plan to help with?",
    mainGoal: "What is your goal?",
    fatLoss: "Fat Loss",
    muscleGain: "Muscle Gain",
    recomposition: "Recomposition",
    maintenance: "Maintenance",
    targetWeightKg: "Target Weight in kg (optional)",

    // Step 5: Health & Preferences
    step5Title: "Health & Preferences",
    step5Sub: "Tell us about any health conditions or diet preferences.",
    medicalConditions: "Do you have any medical conditions?",
    medicalPlaceholder: "e.g. PCOS, Thyroid, Diabetes, High Blood Pressure (or None)",
    dietPreference: "Are you following a specific diet?",
    keto: "Keto",
    lowCarb: "Low Carb",
    balanced: "Balanced",
    otherDiet: "Other",
    allergies: "Food allergies or intolerances?",
    allergiesPlaceholder: "e.g. Nuts, dairy, shellfish, gluten",
    dislikedFoods: "Foods you dislike",
    dislikedPlaceholder: "e.g. Fish, eggplants, coriander",

    // Step 6: Eating Habits
    step6Title: "Eating Habits",
    step6Sub: "Tell us about your daily meal schedule and cravings.",
    mealsPerDay: "Number of meals per day",
    sugarCravings: "Do you crave sugar or carbs frequently?",
    lateNightEating: "Late night eating?",
    yes: "Yes",
    no: "No",

    // Step 7: Additional Notes
    step7Title: "Additional Notes",
    step7Sub: "Anything else our nutritionist should know before building your plan.",
    notes: "Anything else we should know?",
    notesPlaceholder: "Sleep schedule, stress levels, training times, preferred start date...",
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
    requestPlan: "احصل على خطتي",
    step: "خطوة",
    sendingRequest: "بنبعت طلبك...",

    // Step 1: Personal Information
    step1Title: "البيانات الشخصية",
    step1Sub: "اكتب بيانات التواصل الأساسية.",
    fullName: "الاسم بالكامل",
    age: "السن",
    gender: "النوع",
    female: "أنثى",
    male: "ذكر",
    email: "الإيميل",
    phone: "الموبايل (واتساب أفضل)",

    // Step 2: Body Details
    step2Title: "تفاصيل الجسم",
    step2Sub: "بيساعدنا نحسب احتياجك من السعرات والماكروز.",
    weightKg: "الوزن (كجم)",
    heightCm: "الطول (سم)",
    bodyFatPct: "نسبة الدهون % (اختياري)",

    // Step 3: Lifestyle
    step3Title: "نمط الحياة",
    step3Sub: "عرفنا أكتر عن حركتك ونوع شغلك اليومي.",
    activityLevel: "مستوى النشاط الحركي",
    lowActivity: "منخفض (أغلب اليوم قعدة)",
    modActivity: "متوسط (تمرين كام مرة في الأسبوع)",
    highActivity: "عالي (تمرين منتظم وشديد)",
    workType: "نوع العمل",
    deskWork: "عمل مكتبي",
    activeWork: "عمل حركي / ميداني",
    athleteWork: "رياضي / مجهود بدني عالي",

    // Step 4: Goals
    step4Title: "الأهداف",
    step4Sub: "عايز الخطة تساعدك توصل لإيه؟",
    mainGoal: "ما هو هدفك؟",
    fatLoss: "خسارة دهون",
    muscleGain: "زيادة عضل",
    recomposition: "إعادة تشكيل الجسم",
    maintenance: "ثبات الوزن وصحة عامة",
    targetWeightKg: "الوزن المستهدف كجم (اختياري)",

    // Step 5: Health & Preferences
    step5Title: "الصحة والتفضيلات",
    step5Sub: "عرفنا عن أي حالات صحية أو نظام أكل مفضل.",
    medicalConditions: "هل لديك أي حالات صحية أو أمراض؟",
    medicalPlaceholder: "مثلاً: تكيس مبايض، غدة، سكر، ضغط (أو لا يوجد)",
    dietPreference: "هل تتبع نظام غذائي معين؟",
    keto: "كيتو",
    lowCarb: "لو كارب",
    balanced: "متوازن",
    otherDiet: "آخر",
    allergies: "هل لديك أي حساسية أطعمة أو عدم تحمل؟",
    allergiesPlaceholder: "مثلاً: مكسرات، ألبان، جمبري، جلوتين",
    dislikedFoods: "أطعمة لا تحبها",
    dislikedPlaceholder: "مثلاً: سمك، باذنجان، كزبرة",

    // Step 6: Eating Habits
    step6Title: "عادات الأكل",
    step6Sub: "عرفنا عن جدول وجباتك واحتياجك السكري.",
    mealsPerDay: "عدد الوجبات في اليوم",
    sugarCravings: "هل تعاني من اشتهاء السكريات أو الكارب بانتظام؟",
    lateNightEating: "هل تأكل في وقت متأخر من الليل؟",
    yes: "نعم",
    no: "لا",

    // Step 7: Additional Notes
    step7Title: "ملاحظات إضافية",
    step7Sub: "أي معلومات تانية تحب أخصائية التغذية تعرفها قبل تصميم الخطة.",
    notes: "أي شيء آخر يجب أن نعرفه؟",
    notesPlaceholder: "مواعيد نومك، مستوى التوتر، أوقات التمرين، ميعاد البداية المفضل...",
  },
} as const;

type FormValues = {
  fullName: string;
  age: string;
  gender: string;
  email: string;
  phone: string;

  weightKg: string;
  heightCm: string;
  bodyFatPct: string;

  activityLevel: string;
  workType: string;

  goal: string;
  targetWeightKg: string;

  medicalConditions: string;
  dietPreference: string;
  allergies: string;
  dislikedFoods: string;

  mealsPerDay: string;
  sugarCravings: string;
  lateNightEating: string;

  notes: string;
};

const INITIAL_VALUES: FormValues = {
  fullName: "",
  age: "",
  gender: "",
  email: "",
  phone: "",
  weightKg: "",
  heightCm: "",
  bodyFatPct: "",
  activityLevel: "",
  workType: "",
  goal: "",
  targetWeightKg: "",
  medicalConditions: "",
  dietPreference: "",
  allergies: "",
  dislikedFoods: "",
  mealsPerDay: "",
  sugarCravings: "",
  lateNightEating: "",
  notes: "",
};

function buildWhatsAppMessage(d: FormValues, locale: Locale): string {
  const ar = locale === "ar";
  const lines: string[] = [
    ar
      ? "أهلاً Balanced Bites! أنا لسه بعت فورم خطة التغذية المخصصة. دي تفاصيلي:"
      : "Hi Balanced Bites! I just submitted my personalized diet plan request. Here are my details:",
    "",
    `1. ${ar ? "البيانات الشخصية" : "Personal Info"}:`,
    `  ${ar ? "الاسم" : "Name"}: ${d.fullName}`,
    `  ${ar ? "السن" : "Age"}: ${d.age || "-"}`,
    `  ${ar ? "النوع" : "Gender"}: ${d.gender || "-"}`,
    `  ${ar ? "الإيميل" : "Email"}: ${d.email}`,
    `  ${ar ? "الموبايل" : "Phone"}: ${d.phone || "-"}`,
    "",
    `2. ${ar ? "تفاصيل الجسم" : "Body Details"}:`,
    `  ${ar ? "الوزن" : "Weight"}: ${d.weightKg ? `${d.weightKg} kg` : "-"}`,
    `  ${ar ? "الطول" : "Height"}: ${d.heightCm ? `${d.heightCm} cm` : "-"}`,
    `  ${ar ? "نسبة الدهون" : "Body Fat"}: ${d.bodyFatPct ? `${d.bodyFatPct}%` : "-"}`,
    "",
    `3. ${ar ? "نمط الحياة" : "Lifestyle"}:`,
    `  ${ar ? "النشاط" : "Activity"}: ${d.activityLevel || "-"}`,
    `  ${ar ? "العمل" : "Work"}: ${d.workType || "-"}`,
    "",
    `4. ${ar ? "الأهداف" : "Goals"}:`,
    `  ${ar ? "الهدف" : "Goal"}: ${d.goal || "-"}`,
    `  ${ar ? "الوزن المستهدف" : "Target Weight"}: ${d.targetWeightKg ? `${d.targetWeightKg} kg` : "-"}`,
    "",
    `5. ${ar ? "الصحة والتفضيلات" : "Health & Preferences"}:`,
    `  ${ar ? "حالات صحية" : "Medical"}: ${d.medicalConditions || "-"}`,
    `  ${ar ? "النظام" : "Diet"}: ${d.dietPreference || "-"}`,
    `  ${ar ? "الحساسية" : "Allergies"}: ${d.allergies || "-"}`,
    `  ${ar ? "أطعمة لا يحبها" : "Disliked foods"}: ${d.dislikedFoods || "-"}`,
    "",
    `6. ${ar ? "عادات الأكل" : "Eating Habits"}:`,
    `  ${ar ? "الوجبات/يوم" : "Meals/day"}: ${d.mealsPerDay || "-"}`,
    `  ${ar ? "اشتهاء السكر" : "Sugar cravings"}: ${d.sugarCravings || "-"}`,
    `  ${ar ? "أكل بالليل" : "Late night eating"}: ${d.lateNightEating || "-"}`,
    "",
  ];

  if (d.notes) {
    lines.push(`7. ${ar ? "ملاحظات" : "Notes"}:`, d.notes);
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
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
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
      age: values.age.trim(),
      gender: values.gender.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      weightKg: values.weightKg.trim(),
      heightCm: values.heightCm.trim(),
      bodyFatPct: values.bodyFatPct.trim(),
      activityLevel: values.activityLevel.trim(),
      workType: values.workType.trim(),
      goal: values.goal.trim(),
      targetWeightKg: values.targetWeightKg.trim(),
      medicalConditions: values.medicalConditions.trim(),
      dietPreference: values.dietPreference.trim(),
      allergies: values.allergies.trim(),
      dislikedFoods: values.dislikedFoods.trim(),
      mealsPerDay: values.mealsPerDay.trim(),
      sugarCravings: values.sugarCravings.trim(),
      lateNightEating: values.lateNightEating.trim(),
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
        className="mx-auto min-w-0 max-w-3xl px-4 pb-20 pt-8 sm:px-6"
      >
        <div className="min-w-0 overflow-x-clip rounded-[2rem] bg-white p-8 text-center shadow-xl ring-1 ring-[#426237]/10 sm:p-12">
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
      className="mx-auto w-full min-w-0 max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10"
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
        {/* Step 1: Personal Information */}
        <Step>
          <StepHeader
            kicker={`${c.step} 01 / 07`}
            title={c.step1Title}
            subtitle={c.step1Sub}
          />
          <div className="mt-6 min-w-0 space-y-4">
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
            </Row>
            <Row>
              <Field label={c.gender}>
                <select
                  name="gender"
                  value={values.gender}
                  onChange={update("gender")}
                  className={FIELD_CLASS}
                >
                  <option value="">{c.gender}</option>
                  <option value="female">{c.female}</option>
                  <option value="male">{c.male}</option>
                </select>
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

        {/* Step 2: Body Details */}
        <Step>
          <StepHeader
            kicker={`${c.step} 02 / 07`}
            title={c.step2Title}
            subtitle={c.step2Sub}
          />
          <div className="mt-6 min-w-0 space-y-4">
            <Row>
              <Field label={c.weightKg}>
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
              <Field label={c.heightCm}>
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
            <Field label={c.bodyFatPct}>
              <input
                type="number"
                name="bodyFatPct"
                value={values.bodyFatPct}
                onChange={update("bodyFatPct")}
                inputMode="decimal"
                step={0.1}
                min={3}
                max={60}
                placeholder="e.g. 20"
                className={FIELD_CLASS}
              />
            </Field>
          </div>
        </Step>

        {/* Step 3: Lifestyle */}
        <Step>
          <StepHeader
            kicker={`${c.step} 03 / 07`}
            title={c.step3Title}
            subtitle={c.step3Sub}
          />
          <div className="mt-6 min-w-0 space-y-4">
            <Field label={c.activityLevel}>
              <select
                name="activityLevel"
                value={values.activityLevel}
                onChange={update("activityLevel")}
                className={FIELD_CLASS}
              >
                <option value="">{c.activityLevel}</option>
                <option value="Low">{c.lowActivity}</option>
                <option value="Moderate">{c.modActivity}</option>
                <option value="High">{c.highActivity}</option>
              </select>
            </Field>
            <Field label={c.workType}>
              <select
                name="workType"
                value={values.workType}
                onChange={update("workType")}
                className={FIELD_CLASS}
              >
                <option value="">{c.workType}</option>
                <option value="Desk">{c.deskWork}</option>
                <option value="Active">{c.activeWork}</option>
                <option value="Athlete">{c.athleteWork}</option>
              </select>
            </Field>
          </div>
        </Step>

        {/* Step 4: Goals */}
        <Step>
          <StepHeader
            kicker={`${c.step} 04 / 07`}
            title={c.step4Title}
            subtitle={c.step4Sub}
          />
          <div className="mt-6 min-w-0 space-y-4">
            <Field label={c.mainGoal}>
              <select
                name="goal"
                value={values.goal}
                onChange={update("goal")}
                className={FIELD_CLASS}
              >
                <option value="">{c.mainGoal}</option>
                <option value="Fat Loss">{c.fatLoss}</option>
                <option value="Muscle Gain">{c.muscleGain}</option>
                <option value="Recomposition">{c.recomposition}</option>
                <option value="Maintenance">{c.maintenance}</option>
              </select>
            </Field>
            <Field label={c.targetWeightKg}>
              <input
                type="number"
                name="targetWeightKg"
                value={values.targetWeightKg}
                onChange={update("targetWeightKg")}
                inputMode="decimal"
                step={0.1}
                min={30}
                max={250}
                placeholder="e.g. 65"
                className={FIELD_CLASS}
              />
            </Field>
          </div>
        </Step>

        {/* Step 5: Health & Preferences */}
        <Step>
          <StepHeader
            kicker={`${c.step} 05 / 07`}
            title={c.step5Title}
            subtitle={c.step5Sub}
          />
          <div className="mt-6 min-w-0 space-y-4">
            <Field label={c.medicalConditions}>
              <input
                type="text"
                name="medicalConditions"
                value={values.medicalConditions}
                onChange={update("medicalConditions")}
                placeholder={c.medicalPlaceholder}
                className={FIELD_CLASS}
              />
            </Field>
            <Field label={c.dietPreference}>
              <select
                name="dietPreference"
                value={values.dietPreference}
                onChange={update("dietPreference")}
                className={FIELD_CLASS}
              >
                <option value="">{c.dietPreference}</option>
                <option value="Keto">{c.keto}</option>
                <option value="Low Carb">{c.lowCarb}</option>
                <option value="Balanced">{c.balanced}</option>
                <option value="Other">{c.otherDiet}</option>
              </select>
            </Field>
            <Field label={c.allergies}>
              <textarea
                name="allergies"
                rows={2}
                value={values.allergies}
                onChange={update("allergies")}
                placeholder={c.allergiesPlaceholder}
                className={FIELD_CLASS}
              />
            </Field>
            <Field label={c.dislikedFoods}>
              <input
                type="text"
                name="dislikedFoods"
                value={values.dislikedFoods}
                onChange={update("dislikedFoods")}
                placeholder={c.dislikedPlaceholder}
                className={FIELD_CLASS}
              />
            </Field>
          </div>
        </Step>

        {/* Step 6: Eating Habits */}
        <Step>
          <StepHeader
            kicker={`${c.step} 06 / 07`}
            title={c.step6Title}
            subtitle={c.step6Sub}
          />
          <div className="mt-6 min-w-0 space-y-4">
            <Field label={c.mealsPerDay}>
              <select
                name="mealsPerDay"
                value={values.mealsPerDay}
                onChange={update("mealsPerDay")}
                className={FIELD_CLASS}
              >
                <option value="">{c.mealsPerDay}</option>
                <option value="2 meals">2 {locale === "ar" ? "وجبات" : "meals"}</option>
                <option value="3 meals">3 {locale === "ar" ? "وجبات" : "meals"}</option>
                <option value="4 meals">4 {locale === "ar" ? "وجبات" : "meals"}</option>
                <option value="5+ meals">5+ {locale === "ar" ? "وجبات" : "meals"}</option>
              </select>
            </Field>
            <Field label={c.sugarCravings}>
              <select
                name="sugarCravings"
                value={values.sugarCravings}
                onChange={update("sugarCravings")}
                className={FIELD_CLASS}
              >
                <option value="">{c.sugarCravings}</option>
                <option value="Yes">{c.yes}</option>
                <option value="No">{c.no}</option>
              </select>
            </Field>
            <Field label={c.lateNightEating}>
              <select
                name="lateNightEating"
                value={values.lateNightEating}
                onChange={update("lateNightEating")}
                className={FIELD_CLASS}
              >
                <option value="">{c.lateNightEating}</option>
                <option value="Yes">{c.yes}</option>
                <option value="No">{c.no}</option>
              </select>
            </Field>
          </div>
        </Step>

        {/* Step 7: Additional Notes */}
        <Step>
          <StepHeader
            kicker={`${c.step} 07 / 07`}
            title={c.step7Title}
            subtitle={c.step7Sub}
          />
          <div className="mt-6 min-w-0 space-y-4">
            {!state.ok && state.message ? (
              <div className="rounded-xl border border-red-500/20 bg-red-50 p-4 text-sm text-red-700">
                {state.message}
              </div>
            ) : null}
            <Field label={c.notes}>
              <textarea
                name="notes"
                rows={5}
                value={values.notes}
                onChange={update("notes")}
                placeholder={c.notesPlaceholder}
                className={FIELD_CLASS}
              />
            </Field>
          </div>
        </Step>
      </Stepper>
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
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ac8058]">
        {kicker}
      </p>
      <h2 className="menu-serif mt-2 text-2xl font-bold tracking-tight text-[#426237] sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{subtitle}</p>
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
      {children}
    </div>
  );
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
    <label className="block min-w-0 text-sm font-semibold text-[#426237]">
      <span>
        {label}
        {required ? <span className="ms-1 text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}
