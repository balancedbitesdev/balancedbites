"use client";

import { useCallback, useMemo, useState } from "react";
import { dispatchCartUpdated } from "@/lib/cart-client-api";
import type { MenuFilterId, MenuProductSerialized } from "./menu-types";

const FILTERS: { id: MenuFilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "meals", label: "Meals" },
  { id: "desserts", label: "Desserts" },
  { id: "meal_plans", label: "Meal Plans" },
];

type Props = {
  products: MenuProductSerialized[];
};

export function MenuGridClient({ products }: Props) {
  const [active, setActive] = useState<MenuFilterId>("all");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [qtyByProduct, setQtyByProduct] = useState<Record<string, number>>({});

  const visible = useMemo(() => {
    if (active === "all") return products;
    return products.filter((p) => p.filterKey === active);
  }, [products, active]);

  function getQty(productId: string): number {
    return qtyByProduct[productId] ?? 1;
  }

  async function addToCart(product: MenuProductSerialized) {
    if (product.variantId == null) return;
    const quantity = getQty(product.id);
    setAddingId(product.id);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          merchandiseId: product.variantId,
          quantity,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Could not add to cart");
      }
      dispatchCartUpdated();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Could not add to cart");
    } finally {
      setAddingId(null);
    }
  }

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-[#426237]/15 bg-white px-6 py-10 text-center text-sm text-gray-600 shadow-sm">
        No products are available yet.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {FILTERS.map(({ id, label }) => {
          const isOn = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                isOn
                  ? "bg-[#426237] text-white shadow-sm"
                  : "bg-white/90 text-[#426237] shadow-sm ring-1 ring-[#426237]/10 hover:bg-white"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl bg-white/80 px-6 py-8 text-center text-sm text-gray-600 ring-1 ring-[#426237]/10">
          Nothing in this category yet. Try another filter.
        </p>
      ) : (
        <ul
          id="menu-grid"
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {visible.map((product) => (
            <li key={product.id} className="h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-md">
                <ProductCardImage
                  images={product.images}
                  fallbackUrl={product.imageUrl}
                  fallbackAlt={product.imageAlt}
                  categoryLabel={product.categoryLabel}
                />

                <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-5">
                  <h2 className="text-lg font-bold leading-snug tracking-tight text-[#426237]">
                    {product.title}
                  </h2>
                  {product.descriptionPlain ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">
                      {product.descriptionPlain}
                    </p>
                  ) : null}

                  {product.ingredientsPlain ? (
                    <details className="mt-3 rounded-lg bg-[#f4f1eb]/60 px-3 py-2 text-sm ring-1 ring-[#426237]/10">
                      <summary className="cursor-pointer font-semibold text-[#426237]">
                        Ingredients
                      </summary>
                      <p className="mt-2 text-xs leading-relaxed text-gray-600">
                        {product.ingredientsPlain}
                      </p>
                    </details>
                  ) : null}

                  <div className="mt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Nutrition (per serving)
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <MacroPill label="CAL" value={product.cal} />
                      <MacroPill label="PRO" value={product.pro} />
                      <MacroPill label="FAT" value={product.fat} />
                      <MacroPill label="CARB" value={product.carb} />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="sr-only">Quantity</span>
                      <span aria-hidden className="text-xs font-medium uppercase tracking-wide">
                        Qty
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
                        className="w-16 rounded-lg border border-[#426237]/20 bg-[#f4f1eb] px-2 py-1.5 text-center text-sm font-semibold text-[#426237] outline-none focus:ring-2 focus:ring-[#426237]/30"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={
                        product.variantId == null || addingId === product.id
                      }
                      title="Subscribe and save (coming soon)"
                      className="rounded-full border border-dashed border-[#426237]/35 px-4 py-2 text-xs font-semibold text-[#426237]/50 cursor-not-allowed"
                    >
                      Subscribe
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
                        onClick={() => addToCart(product)}
                        title="Add to cart"
                        className="flex h-11 min-w-[7rem] items-center justify-center rounded-full bg-[#426237] px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#2c4224] disabled:opacity-60 active:scale-[0.96]"
                      >
                        {addingId === product.id ? "Adding…" : "Add to cart"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="rounded-full bg-[#f4f1eb] px-4 py-2.5 text-sm font-medium text-[#426237]/45"
                      >
                        Unavailable
                      </button>
                    )}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
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
}: {
  images: { url: string; alt: string }[];
  fallbackUrl: string | null;
  fallbackAlt: string;
  categoryLabel: string;
}) {
  const slides =
    images.length > 0
      ? images
      : fallbackUrl != null
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
    <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-[#f4f1eb]">
      {current != null ? (
        // eslint-disable-next-line @next/next/no-img-element -- Shopify CDN
        <img
          key={current.url}
          src={current.url}
          alt={current.alt}
          className="h-full w-full object-cover transition-opacity duration-300 ease-out"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-center text-xs font-medium tracking-wide text-[#426237]/35">
            Image coming soon
          </p>
        </div>
      )}
      <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-[#426237] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
        {categoryLabel}
      </span>
      {canBrowse ? (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/45 to-transparent px-2 pb-2 pt-8">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#426237] shadow-sm ring-1 ring-[#426237]/15 transition-colors hover:bg-white"
            aria-label="Previous photo"
          >
            <ChevronIcon dir="left" className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={shuffle}
            className="flex h-9 min-w-[5.5rem] items-center justify-center gap-1.5 rounded-full bg-white/90 px-3 text-xs font-semibold text-[#426237] shadow-sm ring-1 ring-[#426237]/15 transition-colors hover:bg-white"
            aria-label="Shuffle to a random photo"
          >
            <ShuffleIcon className="h-4 w-4 shrink-0" />
            Shuffle
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#426237] shadow-sm ring-1 ring-[#426237]/15 transition-colors hover:bg-white"
            aria-label="Next photo"
          >
            <ChevronIcon dir="right" className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
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

function MacroPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium tabular-nums text-gray-600">
      {label}: {value}
    </span>
  );
}
