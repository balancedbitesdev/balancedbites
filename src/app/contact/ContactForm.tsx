"use client";

import { useActionState, useEffect, useState } from "react";
import { InlineSpinner } from "@/components/balanced-bites/InlineSpinner";
import { submitContact, type ContactState } from "./actions";

const initial: ContactState = { ok: false, message: "" };

const fieldClass =
  "mt-2 w-full rounded-xl border border-[#426237]/15 bg-[#f4f1eb] px-4 py-3 text-sm text-[#426237] outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-[#426237]/25 focus:outline-none focus:ring-2 focus:ring-[#426237]/30 focus:ring-offset-1 focus:ring-offset-[#f4f1eb]";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!state.ok) return;
    // Clear controlled fields after successful server action (state.ok from useActionState).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync form to server success flag
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
  }, [state]);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <label htmlFor="name" className="text-sm font-semibold text-[#426237]">
          Name
        </label>
        <input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          className={fieldClass}
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className={fieldClass}
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
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="message" className="text-sm font-semibold text-[#426237]">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          className={fieldClass}
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
        aria-busy={pending}
        className="flex min-h-11 w-full min-w-0 items-center justify-center gap-2 rounded-full bg-[#426237] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_36px_-20px_rgba(66,98,55,0.55)] transition-[background-color,box-shadow,transform,opacity] duration-200 ease-out hover:bg-[#2c4224] hover:shadow-[0_18px_40px_-18px_rgba(66,98,55,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1eb] disabled:cursor-not-allowed disabled:bg-[#426237]/45 disabled:text-white/90 disabled:shadow-none active:scale-95"
      >
        {pending ? (
          <>
            <InlineSpinner className="text-white" />
            <span>Sending…</span>
          </>
        ) : (
          "Send message"
        )}
      </button>
    </form>
  );
}
