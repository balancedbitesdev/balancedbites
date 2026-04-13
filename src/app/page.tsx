import Link from "next/link";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";

export default function Home() {
  const orderNowHref = "/menu";

  return (
    <div className="flex min-h-full flex-col bg-[#f4f1eb] font-sans text-[#426237]">
      <SiteHeader active="home" orderNowHref={orderNowHref} />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-xl ring-1 ring-[#426237]/10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#426237]/70">
            Balanced Bites
          </p>
          <h1 className="menu-serif mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Food for the Whole Family
          </h1>
          <p className="menu-script mt-2 text-xl text-[#426237]/90 sm:text-2xl">
            Healthy Living Made Simple
          </p>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-gray-600">
            Nutritionist-approved meals and desserts—so every generation can eat well without the
            hassle.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/my-plan"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#426237] px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#2c4224] active:scale-[0.98]"
            >
              Get Your Plan
            </Link>
            <Link
              href="/menu"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#f4f1eb] px-8 py-3 text-sm font-semibold text-[#426237] ring-1 ring-[#426237]/20 transition-colors hover:bg-[#ece8df]"
            >
              Browse menu
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter variant="beige" />
    </div>
  );
}
