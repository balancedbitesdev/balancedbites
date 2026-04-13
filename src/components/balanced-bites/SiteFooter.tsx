import Link from "next/link";

type Props = {
  variant?: "beige" | "green";
};

export function SiteFooter({ variant = "beige" }: Props) {
  const isGreen = variant === "green";

  return (
    <footer
      id="contact"
      className={
        isGreen
          ? "border-t border-white/10 bg-[#426237] py-10 text-white"
          : "border-t border-[#426237]/10 bg-[#f4f1eb] py-10"
      }
    >
      <div
        id="footer"
        className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div>
          <p
            className={`menu-serif text-lg font-semibold ${isGreen ? "text-white" : "text-[#426237]"}`}
          >
            Balanced Bites
          </p>
          <p
            className={`mt-1 text-xs ${isGreen ? "text-white/70" : "text-gray-500"}`}
          >
            © {new Date().getFullYear()} Balanced Bites. All rights reserved.
          </p>
        </div>
        <nav
          className={`flex flex-wrap gap-x-6 gap-y-2 text-xs ${isGreen ? "text-white/75" : "text-gray-500"}`}
          aria-label="Footer"
        >
          <Link
            href="/about"
            className={isGreen ? "hover:text-white" : "hover:text-[#426237]"}
          >
            About
          </Link>
          <Link
            href="/contact"
            className={isGreen ? "hover:text-white" : "hover:text-[#426237]"}
          >
            Contact
          </Link>
          <Link
            href="/learn"
            className={isGreen ? "hover:text-white" : "hover:text-[#426237]"}
          >
            Learn
          </Link>
        </nav>
      </div>
    </footer>
  );
}
