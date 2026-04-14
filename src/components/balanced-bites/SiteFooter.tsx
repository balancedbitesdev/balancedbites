import Link from "next/link";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
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
          <div className="flex items-center gap-3" aria-label="Social media">
            <a
              href="https://www.tiktok.com/@_balancedbites__"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white transition-opacity duration-200 hover:opacity-80"
              aria-label="Balanced Bites on TikTok"
            >
              <TikTokIcon className="h-6 w-6" />
            </a>
            <a
              href="https://www.instagram.com/_balancedbites__/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white transition-opacity duration-200 hover:opacity-80"
              aria-label="Balanced Bites on Instagram"
            >
              <InstagramIcon className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
