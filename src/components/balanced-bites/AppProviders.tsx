"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { CartDrawer, CartDrawerProvider } from "./CartDrawer";
import { LocaleProvider } from "./LocaleContext";
import { MobileMenuProvider } from "./MobileMenuContext";
import { SkeletonProviders } from "./SkeletonProviders";
import { ToastProvider } from "./Toast";

export function AppProviders({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Locale;
}) {
  return (
    <LocaleProvider locale={locale}>
      <ToastProvider>
        <SkeletonProviders>
          <MobileMenuProvider>
            <CartDrawerProvider>
              <div id="app-shell" className="flex min-h-full flex-1 flex-col">
                {children}
              </div>
              <CartDrawer />
            </CartDrawerProvider>
          </MobileMenuProvider>
        </SkeletonProviders>
      </ToastProvider>
    </LocaleProvider>
  );
}
