import type { Metadata } from "next";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";
import { getDictionary } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us | Balanced Bites",
  description: "Contact Balanced Bites for orders, delivery, and nutrition questions.",
};

const WHATSAPP =
  process.env.NEXT_PUBLIC_WHATSAPP_E164 ?? "201000000000";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP.replace(/\D/g, "")}`;

// TODO(owner): update these with the exact pickup coords.
// Override via .env: NEXT_PUBLIC_PICKUP_LAT / LNG / LABEL.
const PICKUP_LAT = process.env.NEXT_PUBLIC_PICKUP_LAT ?? "29.9792";
const PICKUP_LNG = process.env.NEXT_PUBLIC_PICKUP_LNG ?? "30.9445";
const PICKUP_LABEL =
  process.env.NEXT_PUBLIC_PICKUP_LABEL ?? "Our kitchen in 6th of October";

function pickupEmbedUrl() {
  const q = `${PICKUP_LAT},${PICKUP_LNG}`;
  return `https://maps.google.com/maps?q=${q}&z=14&output=embed`;
}

function pickupExternalUrl() {
  return `https://maps.google.com/?q=${PICKUP_LAT},${PICKUP_LNG}`;
}

export default async function ContactPage() {
  const locale = await getRequestLocale();
  const t = getDictionary(locale);

  return (
    <div className="min-h-full bg-[#f4f1eb] font-sans text-[#426237]">
      <SiteHeader active="contact" orderNowHref="/menu" />

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-3 sm:px-6 sm:pb-16 sm:pt-4">
        <h1 className="menu-serif text-4xl font-semibold tracking-tight">{t.contact.title}</h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-gray-600">
          {t.contact.intro}
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-[#426237]/10">
            <h2 className="text-lg font-semibold text-[#426237]">{t.contact.whatsappPrimary}</h2>
            <p className="mt-2 text-sm text-gray-600">
              {t.contact.whatsappBody}
            </p>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#426237] px-8 py-3 text-sm font-semibold text-white hover:bg-[#2c4224]"
            >
              {t.contact.whatsappCta}
            </a>

            <div className="mt-10 border-t border-[#426237]/10 pt-8">
              <h2 className="text-lg font-semibold text-[#426237]">{t.contact.direct}</h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                <li>
                  <span className="font-medium text-[#426237]">{t.contact.hours} </span>
                  {t.contact.hoursText}
                </li>
                <li>
                  <span className="font-medium text-[#426237]">{t.contact.friday} </span>
                  {t.contact.closed}
                </li>
                <li>
                  <span className="font-medium text-[#426237]">{t.contact.pickup} </span>
                  {t.contact.pickupText}
                </li>
              </ul>
            </div>

            <ContactForm />
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-[#426237]/10">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f4f1eb]">
                <iframe
                  title={`Balanced Bites pickup location at ${PICKUP_LABEL}`}
                  src={pickupEmbedUrl()}
                  className="h-full w-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-[#426237]">{t.contact.pickupLocation}</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {t.contact.pickupBodyPrefix} {PICKUP_LABEL}. {t.contact.pickupBodySuffix}
                </p>
                <a
                  href={pickupExternalUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm font-semibold text-[#426237] underline decoration-[#426237]/30 underline-offset-4"
                >
                  {t.contact.openMaps}
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
