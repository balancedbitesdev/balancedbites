import Link from "next/link";

export function SiteFooter() {
  return (
    <footer
      id="contact"
      className="border-t border-white/10 bg-[#426237] py-10 text-white"
    >
      <div
        id="footer"
        className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div>
          <p className="menu-serif text-lg font-semibold text-white">Balanced Bites</p>
          <p className="mt-1 text-xs text-white/70">
            © {new Date().getFullYear()} Balanced Bites. All rights reserved.
          </p>
        </div>
        <nav
          className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/75"
          aria-label="Footer"
        >
          <Link href="/about" className="transition-colors duration-200 ease-out hover:text-white">
            About
          </Link>
          <Link href="/contact" className="transition-colors duration-200 ease-out hover:text-white">
            Contact
          </Link>
          <Link href="/learn" className="transition-colors duration-200 ease-out hover:text-white">
            Learn
          </Link>
        </nav>
      </div>
    </footer>
  );
}
