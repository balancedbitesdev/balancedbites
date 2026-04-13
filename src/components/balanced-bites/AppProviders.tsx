"use client";

import type { ReactNode } from "react";
import { CartDrawer, CartDrawerProvider } from "./CartDrawer";
import { MobileMenuProvider } from "./MobileMenuContext";
import { SkeletonProviders } from "./SkeletonProviders";
import { ToastProvider } from "./Toast";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
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
  );
}
