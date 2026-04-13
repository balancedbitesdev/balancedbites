"use client";

import {
  type ReactNode,
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";

type Variant = "fade-up" | "fade" | "slide-left" | "slide-right" | "scale";

const HIDDEN: Record<Variant, CSSProperties> = {
  "fade-up": { opacity: 0, transform: "translateY(32px)" },
  fade: { opacity: 0 },
  "slide-left": { opacity: 0, transform: "translateX(-40px)" },
  "slide-right": { opacity: 0, transform: "translateX(40px)" },
  scale: { opacity: 0, transform: "scale(0.96)" },
};

const VISIBLE: CSSProperties = {
  opacity: 1,
  transform: "translate(0) scale(1)",
};

type Props = {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  duration?: number;
  className?: string;
  as?: keyof HTMLElementTagNameMap;
  once?: boolean;
};

export function ScrollReveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 900,
  className = "",
  as: Tag = "div",
  once = true,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- show content when motion is reduced
      setVisible(true);
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const style: CSSProperties = {
    ...(visible ? VISIBLE : HIDDEN[variant]),
    transition: `opacity ${duration}ms cubic-bezier(0.23,1,0.32,1) ${delay}ms, transform ${duration}ms cubic-bezier(0.23,1,0.32,1) ${delay}ms`,
    willChange: visible ? "auto" : "opacity, transform",
  };

  return (
    // @ts-expect-error -- dynamic tag
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}
