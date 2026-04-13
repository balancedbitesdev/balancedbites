"use client";

import type { ReactNode } from "react";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export function SkeletonProviders({ children }: { children: ReactNode }) {
  return (
    <SkeletonTheme
      baseColor="#d4cfc4"
      highlightColor="#f4f1eb"
      borderRadius={12}
      duration={1.15}
      enableAnimation
    >
      {children}
    </SkeletonTheme>
  );
}
