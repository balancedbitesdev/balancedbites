import type { Metadata } from "next";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us | Balanced Bites",
  description: "Contact Balanced Bites for orders, delivery, and nutrition questions.",
};

const WHATSAPP =
  process.env.NEXT_PUBLIC_WHATSAPP_E164 ?? "201000000000";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP.replace(/\D/g, "")}`;

export default function ContactPage() {
  return (
    <div className="min-h-full bg-[#f4f1eb] font-sans text-[#426237]">
      <SiteHeader active="contact" orderNowHref="/menu" />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="menu-serif text-4xl font-semibold tracking-tight">Contact Us</h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-gray-600">
          Reach us on WhatsApp for the fastest response, or send a message through the form.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-[#426237]/10">
            <h2 className="text-lg font-semibold text-[#426237]">WhatsApp (primary)</h2>
            <p className="mt-2 text-sm text-gray-600">
              Tap below to chat with our team about orders, delivery zones, and meal plans.
            </p>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#426237] px-8 py-3 text-sm font-semibold text-white hover:bg-[#2c4224]"
            >
              Message on WhatsApp
            </a>

            <div className="mt-10 border-t border-[#426237]/10 pt-8">
              <h2 className="text-lg font-semibold text-[#426237]">Direct</h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                <li>
                  <span className="font-medium text-[#426237]">Hours: </span>
                  Open Saturday–Thursday, 9:00 AM – 9:00 PM
                </li>
                <li>
                  <span className="font-medium text-[#426237]">Fridays: </span>
                  Closed
                </li>
                <li>
                  <span className="font-medium text-[#426237]">Delivery: </span>
                  6th of October and Sheikh Zayed only
                </li>
                <li>
                  <span className="font-medium text-[#426237]">Pickup: </span>
                  Saturdays from 10:00 AM
                </li>
              </ul>
            </div>

            <ContactForm />
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-[#426237]/10">
              <div className="aspect-[4/3] w-full bg-[#f4f1eb]">
                <iframe
                  title="Balanced Bites service area — 6th October and Sheikh Zayed"
                  src="https://maps.google.com/maps?q=6th+of+October+City,+Giza,+Egypt&z=11&output=embed"
                  className="h-full w-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-[#426237]">Location & areas</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  We deliver exclusively to <strong>6th of October</strong> and{" "}
                  <strong>Sheikh Zayed</strong>. Customers outside these zones may order for{" "}
                  <strong>Saturday pickup</strong> (from 10:00 AM) by coordinating on WhatsApp.
                </p>
                <a
                  href="https://maps.google.com/?q=6th+of+October+City,+Giza,+Egypt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm font-semibold text-[#426237] underline decoration-[#426237]/30 underline-offset-4"
                >
                  Open in Google Maps
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
