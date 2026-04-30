"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { InlineSpinner } from "@/components/balanced-bites/InlineSpinner";
import { useToast } from "@/components/balanced-bites/Toast";
import { dispatchCartUpdated } from "@/lib/cart-client-api";
import { friendlyCartError } from "@/lib/friendly-cart-errors";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { MenuFilterId, MenuProductSerialized } from "./menu-types";

const FILTERS: { id: MenuFilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "keto_desserts", label: "Keto Desserts" },
  { id: "high_protein", label: "High Protein" },
  { id: "clean_carb", label: "Clean Carb" },
  { id: "veggie_sides", label: "Vegetable Sides" },
  { id: "salads", label: "Salads" },
  { id: "frozen", label: "Frozen" },
];

const MAX_ALLERGY_LENGTH = 500;

type Props = {
  products: MenuProductSerialized[];
  locale: Locale;
};

type AddToCartArgs = {
  product: MenuProductSerialized;
  quantity: number;
  allergies: string;
  notes: string;
};

export function MenuGridClient({ products, locale }: Props) {
  const t = getDictionary(locale);
  const { show: showToast, showSoft } = useToast();
  const [active, setActive] = useState<MenuFilterId>("all");
  const [query, setQuery] = useState<string>("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [qtyByProduct, setQtyByProduct] = useState<Record<string, number>>({});
  const [detailProduct, setDetailProduct] =
    useState<MenuProductSerialized | null>(null);

  const trimmedQuery = query.trim().toLowerCase();

  const visible = useMemo(() => {
    const byFilter =
      active === "all"
        ? products
        : products.filter((p) => p.filterKey === active);
    if (trimmedQuery.length === 0) return byFilter;
    return byFilter.filter((p) => {
      const haystack = [
        p.title,
        p.descriptionPlain,
        p.ingredientsPlain,
        p.categoryLabel,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(trimmedQuery);
    });
  }, [products, active, trimmedQuery]);

  const getQty = useCallback(
    (productId: string): number => qtyByProduct[productId] ?? 1,
    [qtyByProduct],
  );

  const addToCart = useCallback(
    async ({ product, quantity, allergies, notes }: AddToCartArgs) => {
      if (product.variantId == null) return false;
      setAddingId(product.id);
      try {
        const attributes: { key: string; value: string }[] = [];
        if (allergies.trim().length > 0) {
          attributes.push({
            key: "Allergies",
            value: allergies.trim().slice(0, MAX_ALLERGY_LENGTH),
          });
        }
        if (notes.trim().length > 0) {
          attributes.push({
            key: "Notes",
            value: notes.trim().slice(0, MAX_ALLERGY_LENGTH),
          });
        }
        const res = await fetch("/api/cart", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add",
            merchandiseId: product.variantId,
            quantity,
            ...(attributes.length > 0 ? { attributes } : {}),
          }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? "Could not add to cart");
        }
        dispatchCartUpdated({ added: { title: product.title } });
        showToast(`${t.menu.addedToCart}: ${product.title}`);
        return true;
      } catch (e) {
        console.error(e);
        showSoft(friendlyCartError(e instanceof Error ? e.message : undefined));
        return false;
      } finally {
        setAddingId(null);
      }
    },
    [showToast, showSoft, t.menu.addedToCart],
  );

  async function quickAdd(product: MenuProductSerialized) {
    await addToCart({
      product,
      quantity: getQty(product.id),
      allergies: "",
      notes: "",
    });
  }

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-[#426237]/15 bg-white px-6 py-10 text-center text-sm text-gray-600 shadow-sm">
        {t.menu.noProducts}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <label className="relative block w-full sm:max-w-md">
          <span className="sr-only">{t.menu.searchSr}</span>
          <span
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#426237]/55"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="1.75"
              />
              <path
                d="m20 20-3.2-3.2"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.menu.searchPlaceholder}
            className="h-12 w-full rounded-full border border-[#426237]/12 bg-white/95 pl-11 pr-11 text-sm text-[#426237] shadow-sm outline-none transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-[#426237]/45 focus:border-[#426237]/30 focus:ring-2 focus:ring-[#426237]/25"
          />
          {query.length > 0 ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t.menu.clearSearch}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#426237]/60 transition-colors hover:bg-[#426237]/8 hover:text-[#426237] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/35"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : null}
        </label>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          {FILTERS.map(({ id, label }) => {
            const isOn = active === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1eb] active:scale-[0.97] ${
                  isOn
                    ? "bg-[#426237] text-white shadow-[0_12px_32px_-18px_rgba(66,98,55,0.55)]"
                    : "bg-white/90 text-[#426237] shadow-sm ring-1 ring-[#426237]/10 hover:bg-white hover:shadow-[0_10px_28px_-20px_rgba(66,98,55,0.25)]"
                }`}
              >
                {t.menu.filters[id] ?? label}
              </button>
            );
          })}
        </div>

        {trimmedQuery.length > 0 ? (
          <p
            className="text-xs font-medium text-[#426237]/70"
            aria-live="polite"
          >
            {visible.length === 0
              ? `${t.menu.noMatchesFor} "${query}"`
              : `${visible.length} ${
                  visible.length === 1 ? t.menu.result : t.menu.results
                } "${query}"`}
          </p>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl bg-white/80 px-6 py-8 text-center text-sm text-gray-600 ring-1 ring-[#426237]/10">
          {trimmedQuery.length > 0
            ? t.menu.noMatches
            : t.menu.emptyCategory}
        </p>
      ) : (
        <ul
          id="menu-grid"
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {visible.map((product) => (
            <li key={product.id} className="h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-lg">
                <ProductCardImage
                  images={product.images}
                  fallbackUrl={product.imageUrl}
                  fallbackAlt={product.imageAlt}
                  categoryLabel={product.categoryLabel}
                  onOpenDetails={() => setDetailProduct(product)}
                />

                <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-5">
                  <button
                    type="button"
                    onClick={() => setDetailProduct(product)}
                    className="text-left outline-none transition-colors focus-visible:text-[#2c4224]"
                  >
                    <h2 className="text-lg font-bold leading-snug tracking-tight text-[#426237] hover:underline decoration-[#426237]/30 underline-offset-4">
                      {product.title}
                    </h2>
                  </button>
                  {product.descriptionPlain ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">
                      {product.descriptionPlain}
                    </p>
                  ) : null}

                  {product.ingredientsPlain ? (
                    <details className="mt-3 rounded-lg bg-[#f4f1eb]/60 px-3 py-2 text-sm ring-1 ring-[#426237]/10">
                      <summary className="cursor-pointer font-semibold text-[#426237]">
                        {locale === "ar" ? "المكونات" : "Ingredients"}
                      </summary>
                      <p className="mt-2 text-xs leading-relaxed text-gray-600">
                        {product.ingredientsPlain}
                      </p>
                    </details>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="sr-only">{t.menu.quantity}</span>
                      <span aria-hidden className="text-xs font-medium uppercase tracking-wide">
                        {locale === "ar" ? "كمية" : "Qty"}
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={99}
                        value={getQty(product.id)}
                        onChange={(e) => {
                          const n = Math.min(
                            99,
                            Math.max(1, Math.floor(Number(e.target.value) || 1)),
                          );
                          setQtyByProduct((prev) => ({
                            ...prev,
                            [product.id]: n,
                          }));
                        }}
                        className="w-16 rounded-lg border border-[#426237]/20 bg-[#f4f1eb] px-2 py-1.5 text-center text-sm font-semibold text-[#426237] outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-[#426237]/40 focus:outline-none focus:ring-2 focus:ring-[#426237]/30 focus:ring-offset-2 focus:ring-offset-white"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setDetailProduct(product)}
                      title="Open product details & add allergy notes"
                      className="rounded-full border border-dashed border-[#426237]/35 px-4 py-2 text-xs font-semibold text-[#426237]/75 transition-colors hover:border-[#426237]/60 hover:text-[#426237]"
                    >
                      {locale === "ar" ? "تفاصيل وحساسية" : "Details & allergies"}
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                    <p className="text-lg font-bold tabular-nums text-[#426237]">
                      {product.priceLabel}
                    </p>
                    {product.variantId != null ? (
                      <button
                        type="button"
                        disabled={addingId === product.id}
                        onClick={() => void quickAdd(product)}
                        title={t.menu.add}
                        aria-busy={addingId === product.id}
                        className="flex h-11 min-w-[8.5rem] items-center justify-center gap-2 rounded-full bg-[#426237] px-4 text-sm font-semibold text-white shadow-[0_14px_36px_-20px_rgba(66,98,55,0.65)] transition-[background-color,box-shadow,transform,opacity] duration-200 ease-out hover:bg-[#2c4224] hover:shadow-[0_18px_40px_-18px_rgba(66,98,55,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-[#426237]/45 disabled:text-white/90 disabled:shadow-none active:scale-[0.97]"
                      >
                        {addingId === product.id ? (
                          <>
                            <InlineSpinner className="text-white" />
                            <span className="sr-only">{t.menu.adding}</span>
                          </>
                        ) : (
                          t.menu.add
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="cursor-not-allowed rounded-full bg-[#e8e4dc] px-4 py-2.5 text-sm font-medium text-[#426237]/40 ring-1 ring-[#426237]/10"
                      >
                        {locale === "ar" ? "مش متاح" : "Unavailable"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <ProductDetailsDialog
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onAddToCart={async (args) => {
          const ok = await addToCart(args);
          if (ok) setDetailProduct(null);
          return ok;
        }}
        isAdding={
          detailProduct != null && addingId === detailProduct.id
        }
        locale={locale}
      />
    </div>
  );
}

function ProductCardImageSlide({ url, alt }: { url: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useLayoutEffect(() => {
    setLoaded(false);
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [url]);

  return (
    <>
      <div
        className={`absolute inset-0 bg-gradient-to-br from-[#ebe6de] to-[#f4f1eb] transition-opacity duration-[280ms] ease-[var(--bb-ease-out)] motion-reduce:duration-75 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden
      >
        <div className="absolute inset-0 animate-pulse bg-[#426237]/[0.06]" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- Shopify CDN */}
      <img
        ref={imgRef}
        src={url}
        alt={alt}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-[opacity,transform] duration-[280ms] ease-[var(--bb-ease-out)] motion-reduce:duration-75 ${
          loaded ? "scale-100 opacity-100" : "scale-[1.02] opacity-0"
        }`}
      />
    </>
  );
}

function pickShuffleIndex(length: number, current: number): number {
  if (length <= 1) return 0;
  let n = Math.floor(Math.random() * length);
  let guard = 0;
  while (n === current && guard < 8) {
    n = Math.floor(Math.random() * length);
    guard += 1;
  }
  if (n === current) return (current + 1) % length;
  return n;
}

function ProductCardImage({
  images,
  fallbackUrl,
  fallbackAlt,
  categoryLabel,
  onOpenDetails,
}: {
  images: { url: string; alt: string }[];
  fallbackUrl: string | null;
  fallbackAlt: string;
  categoryLabel: string;
  onOpenDetails: () => void;
}) {
  const fromImages = images.filter((im) => im.url.trim().length > 0);
  const slides =
    fromImages.length > 0
      ? fromImages
      : fallbackUrl != null && fallbackUrl.trim().length > 0
        ? [{ url: fallbackUrl, alt: fallbackAlt }]
        : [];

  const [index, setIndex] = useState(0);
  const canBrowse = slides.length > 1;
  const current = slides[index] ?? slides[0];

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const shuffle = useCallback(() => {
    setIndex((i) => pickShuffleIndex(slides.length, i));
  }, [slides.length]);

  return (
    <div className="group relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-[#f4f1eb]">
      <button
        type="button"
        onClick={onOpenDetails}
        className="absolute inset-0 z-0 cursor-zoom-in outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#426237]/30"
        aria-label="View product details"
      >
        {current != null ? (
          <ProductCardImageSlide key={current.url} url={current.url} alt={current.alt} />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-center text-xs font-medium tracking-wide text-[#426237]/35">
              Image coming soon
            </p>
          </div>
        )}
      </button>

      <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-[#426237] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
        {categoryLabel}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#426237] opacity-0 ring-1 ring-[#426237]/10 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
        View details
      </span>

      {canBrowse ? (
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/45 to-transparent px-2 pb-2 pt-8">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#426237] shadow-sm ring-1 ring-[#426237]/15 transition-[background-color,transform] duration-150 ease-out hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.97]"
            aria-label="Previous photo"
          >
            <ChevronIcon dir="left" className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={shuffle}
            className="flex h-9 min-w-[5.5rem] items-center justify-center gap-1.5 rounded-full bg-white/90 px-3 text-xs font-semibold text-[#426237] shadow-sm ring-1 ring-[#426237]/15 transition-[background-color,transform] duration-150 ease-out hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.97]"
            aria-label="Shuffle to a random photo"
          >
            <ShuffleIcon className="h-4 w-4 shrink-0" />
            Shuffle
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#426237] shadow-sm ring-1 ring-[#426237]/15 transition-[background-color,transform] duration-150 ease-out hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.97]"
            aria-label="Next photo"
          >
            <ChevronIcon dir="right" className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ProductDetailsDialog({
  product,
  onClose,
  onAddToCart,
  isAdding,
  locale,
}: {
  product: MenuProductSerialized | null;
  onClose: () => void;
  onAddToCart: (args: AddToCartArgs) => Promise<boolean>;
  isAdding: boolean;
  locale: Locale;
}) {
  const t = getDictionary(locale);
  const [qty, setQty] = useState(1);
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");
  const [imageIdx, setImageIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isOpen = product != null;

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    /* eslint-disable react-hooks/set-state-in-effect -- Reset modal state when a new product opens; driven by product id change. */
    setQty(1);
    setAllergies("");
    setNotes("");
    setImageIdx(0);
    /* eslint-enable react-hooks/set-state-in-effect */
    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen, product?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!mounted || product == null) return null;

  const slides =
    product.images.length > 0
      ? product.images
      : product.imageUrl != null
        ? [{ url: product.imageUrl, alt: product.imageAlt }]
        : [];
  const currentImage = slides[imageIdx] ?? slides[0];

  const panel = (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={product.title}
    >
      <button
        type="button"
        onClick={onClose}
        className="bb-modal-backdrop absolute inset-0 bg-[#1a1a1a]/55 backdrop-blur-[3px]"
        aria-label="Close product details"
        style={{ animation: "bb-modal-fade 220ms ease-out" }}
      />

      <div
        className="bb-modal-panel relative flex max-h-[min(94dvh,920px)] w-full max-w-4xl flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl ring-1 ring-[#426237]/15 sm:max-h-[94vh] sm:rounded-[2rem]"
        style={{
          animation:
            "bb-modal-rise 280ms cubic-bezier(0.32, 0.72, 0, 1) both",
        }}
      >
        <div className="absolute end-4 top-4 z-10 sm:end-5 sm:top-5">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#426237] shadow-sm ring-1 ring-[#426237]/12 transition-[background-color,transform] duration-150 ease-out hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/35 active:scale-[0.97]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10">
          <div className="relative aspect-[4/3] w-full shrink-0 bg-[#f4f1eb] lg:aspect-auto lg:min-h-[min(28rem,52dvh)]">
            {currentImage != null ? (
              // eslint-disable-next-line @next/next/no-img-element -- Shopify CDN
              <img
                key={currentImage.url}
                src={currentImage.url}
                alt={currentImage.alt}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <p className="text-sm font-medium text-[#426237]/40">
                  Image coming soon
                </p>
              </div>
            )}

            {slides.length > 1 ? (
              <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
                {slides.map((s, i) => (
                  <button
                    key={s.url}
                    type="button"
                    onClick={() => setImageIdx(i)}
                    aria-label={`Show image ${i + 1}`}
                    className={`h-2 rounded-full transition-[width,background-color] duration-200 ${
                      i === imageIdx
                        ? "w-6 bg-white shadow-sm"
                        : "w-2 bg-white/55 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-col gap-6 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10 sm:gap-7 sm:px-9 sm:pb-12 sm:pt-11 lg:gap-8 lg:px-10 lg:pb-14 lg:pt-12">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ac8058]">
                {product.categoryLabel}
              </p>
              <h2 className="menu-serif text-2xl font-bold leading-tight text-[#426237] sm:text-3xl">
                {product.title}
              </h2>
              <p className="text-xl font-bold tabular-nums text-[#426237]">
                {product.priceLabel}
              </p>
            </div>

            {product.descriptionPlain ? (
              <p className="text-sm leading-relaxed text-gray-600 sm:text-[0.9375rem] sm:leading-7">
                {product.descriptionPlain}
              </p>
            ) : null}

            {product.ingredientsPlain ? (
              <details className="rounded-xl bg-[#f4f1eb]/60 px-4 py-3.5 ring-1 ring-[#426237]/10 sm:px-5 sm:py-4">
                <summary className="cursor-pointer text-sm font-semibold text-[#426237]">
                  {locale === "ar" ? "المكونات" : "Ingredients"}
                </summary>
                <p className="mt-2.5 text-xs leading-relaxed text-gray-600 sm:text-sm">
                  {product.ingredientsPlain}
                </p>
              </details>
            ) : null}

            <div className="flex flex-col gap-4 rounded-2xl border border-amber-200/70 bg-amber-50/50 p-4 sm:gap-4 sm:p-5 lg:p-6">
              <div className="space-y-2">
                <label
                  htmlFor={`allergies-${product.id}`}
                  className="flex items-center gap-2 text-sm font-semibold text-[#426237]"
                >
                  <span
                    aria-hidden
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[11px] text-amber-900"
                  >
                    !
                  </span>
                  {locale === "ar" ? "في أي حساسية لازم نعرفها؟" : "Any allergies we should know?"}
                </label>
                <p className="text-xs leading-relaxed text-gray-600 sm:text-[0.8125rem]">
                  {locale === "ar"
                    ? "مكسرات، لبن، بيض، جلوتين - أي حاجة. هنشوفها مع طلبك."
                    : "Nut, dairy, egg, gluten - anything at all. We'll see this with your order."}
                </p>
                <textarea
                  id={`allergies-${product.id}`}
                  value={allergies}
                  onChange={(e) =>
                    setAllergies(e.target.value.slice(0, MAX_ALLERGY_LENGTH))
                  }
                  rows={2}
                  maxLength={MAX_ALLERGY_LENGTH}
                  placeholder={locale === "ar" ? "مثلاً: حساسية من الفول السوداني أو الجمبري" : "e.g. Allergic to peanuts and shellfish"}
                  className="mt-1 w-full rounded-xl border border-[#426237]/15 bg-white px-3.5 py-2.5 text-sm text-[#426237] outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-[#426237]/40 focus:ring-2 focus:ring-[#426237]/25 sm:px-4 sm:py-3"
                />
              </div>

              <div className="border-t border-amber-200/60 pt-4">
                <label
                  htmlFor={`notes-${product.id}`}
                  className="text-sm font-semibold text-[#426237]"
                >
                  {locale === "ar" ? "طلبات خاصة (اختياري)" : "Special requests (optional)"}
                </label>
                <textarea
                  id={`notes-${product.id}`}
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value.slice(0, MAX_ALLERGY_LENGTH))
                  }
                  rows={2}
                  maxLength={MAX_ALLERGY_LENGTH}
                  placeholder={locale === "ar" ? "مثلاً: شطة أقل، الصوص على جنب" : "e.g. Less spicy, extra sauce on the side"}
                  className="mt-2 w-full rounded-xl border border-[#426237]/15 bg-white px-3.5 py-2.5 text-sm text-[#426237] outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-[#426237]/40 focus:ring-2 focus:ring-[#426237]/25 sm:px-4 sm:py-3"
                />
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-4 border-t border-[#426237]/10 pt-6 sm:flex-row sm:items-center sm:gap-5 sm:pt-7">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-xs font-medium uppercase tracking-wide">{locale === "ar" ? "كمية" : "Qty"}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={99}
                  value={qty}
                  onChange={(e) =>
                    setQty(
                      Math.min(
                        99,
                        Math.max(1, Math.floor(Number(e.target.value) || 1)),
                      ),
                    )
                  }
                  className="w-20 rounded-lg border border-[#426237]/20 bg-[#f4f1eb] px-2 py-2 text-center text-sm font-semibold text-[#426237] outline-none focus:border-[#426237]/40 focus:ring-2 focus:ring-[#426237]/25"
                />
              </label>
              {product.variantId != null ? (
                <button
                  type="button"
                  disabled={isAdding}
                  onClick={() =>
                    void onAddToCart({
                      product,
                      quantity: qty,
                      allergies,
                      notes,
                    })
                  }
                  aria-busy={isAdding}
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#426237] px-6 text-sm font-semibold text-white shadow-[0_14px_36px_-20px_rgba(66,98,55,0.65)] transition-[background-color,box-shadow,transform,opacity] duration-200 ease-out hover:bg-[#2c4224] hover:shadow-[0_18px_40px_-18px_rgba(66,98,55,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-[#426237]/45 disabled:text-white/90 disabled:shadow-none active:scale-[0.97]"
                >
                  {isAdding ? (
                    <>
                      <InlineSpinner className="text-white" />
                      <span>Adding…</span>
                    </>
                  ) : (
                    t.menu.add
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex min-h-12 flex-1 cursor-not-allowed items-center justify-center rounded-full bg-[#e8e4dc] text-sm font-semibold text-[#426237]/40 ring-1 ring-[#426237]/10"
                >
                  {locale === "ar" ? "مش متاح" : "Unavailable"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}

function ChevronIcon({
  dir,
  className,
}: {
  dir: "left" | "right";
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d={dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShuffleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 17h4.5a4 4 0 003.6-2.2M3 7h4.5a4 4 0 013.6 2.2M21 7h-4.5a4 4 0 00-3.6 2.2M21 17h-4.5a4 4 0 01-3.6-2.2M3 3l3 3m12 12l3 3M3 21l3-3m12-12l3-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
