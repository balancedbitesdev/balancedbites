"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type ToastItem = { id: string; message: string };

type ToastContextValue = {
  show: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (ctx == null) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

const TOAST_MS = 3600;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const timeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    // Portal target only exists after mount (SSR-safe).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-only portal gate
    setMounted(true);
  }, []);

  const remove = useCallback((id: string) => {
    const t = timeouts.current.get(id);
    if (t != null) clearTimeout(t);
    timeouts.current.delete(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const show = useCallback(
    (message: string) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setItems((prev) => [...prev, { id, message }]);
      const tid = setTimeout(() => remove(id), TOAST_MS);
      timeouts.current.set(id, tid);
    },
    [remove],
  );

  useEffect(() => {
    const map = timeouts.current;
    return () => {
      for (const t of map.values()) clearTimeout(t);
      map.clear();
    };
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted ? createPortal(<ToastViewport items={items} onDismiss={remove} />, document.body) : null}
    </ToastContext.Provider>
  );
}

function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  const regionId = useId();

  if (items.length === 0) return null;

  return (
    <div
      id={regionId}
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-[1080] flex max-w-[min(calc(100vw-2rem),20rem)] flex-col gap-2 sm:bottom-6 sm:right-6"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto bb-toast-enter rounded-2xl border border-[#426237]/12 bg-white/95 px-4 py-3 text-sm font-medium text-[#426237] shadow-[0_20px_50px_-24px_rgba(66,98,55,0.45)] ring-1 ring-[#426237]/8 backdrop-blur-sm"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#426237]/10 text-xs">
              ✓
            </span>
            <p className="min-w-0 flex-1 leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#426237]/50 transition-[color,transform] duration-150 ease-out hover:bg-[#426237]/8 hover:text-[#426237] active:scale-95"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
