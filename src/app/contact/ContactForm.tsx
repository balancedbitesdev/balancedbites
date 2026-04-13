"use client";

import { useActionState } from "react";
import { submitContact, type ContactState } from "./actions";

const initial: ContactState = { ok: false, message: "" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, initial);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <label htmlFor="name" className="text-sm font-semibold text-[#426237]">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          autoComplete="name"
          className="mt-2 w-full rounded-xl border border-[#426237]/15 bg-[#f4f1eb] px-4 py-3 text-sm text-[#426237] outline-none focus:ring-2 focus:ring-[#426237]/25"
        />
      </div>
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-[#426237]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-2 w-full rounded-xl border border-[#426237]/15 bg-[#f4f1eb] px-4 py-3 text-sm text-[#426237] outline-none focus:ring-2 focus:ring-[#426237]/25"
        />
      </div>
      <div>
        <label htmlFor="phone" className="text-sm font-semibold text-[#426237]">
          Phone (WhatsApp preferred)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className="mt-2 w-full rounded-xl border border-[#426237]/15 bg-[#f4f1eb] px-4 py-3 text-sm text-[#426237] outline-none focus:ring-2 focus:ring-[#426237]/25"
        />
      </div>
      <div>
        <label htmlFor="message" className="text-sm font-semibold text-[#426237]">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="mt-2 w-full rounded-xl border border-[#426237]/15 bg-[#f4f1eb] px-4 py-3 text-sm text-[#426237] outline-none focus:ring-2 focus:ring-[#426237]/25"
        />
      </div>
      {state.message ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${state.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full rounded-full bg-[#426237] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2c4224] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
