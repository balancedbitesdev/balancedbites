"use client";

import {
  useCallback,
  useEffect,
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
import { formatUnifiedMacros } from "@/lib/parse-product-nutrition";
import type {
  MenuCategoryChip,
  MenuProductSerialized,
  MenuProductVariantSerialized,
} from "./menu-types";

const MAX_ALLERGY_LENGTH = 500;

type Props = {
  products: MenuProductSerialized[];
  categories?: MenuCategoryChip[];
  locale: Locale;
};

type AddToCartArgs = {
  product: MenuProductSerialized;
  quantity: number;
  allergies: string;
  notes: string;
  selectedVariant?: MenuProductVariantSerialized | null;
};

export function MenuGridClient({ products, categories, locale }: Props) {
  const t = getDictionary(locale);
  const { show: showToast, showSoft } = useToast();
  const [active, setActive] = useState<string>("all");
  const [query, setQuery] = useState<string>("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [qtyByProduct, setQtyByProduct] = useState<Record<string, number>>({});
  const [detailProduct, setDetailProduct] =
    useState<MenuProductSerialized | null>(null);

  // Normalize search query: trimmed, lowercase
  const trimmedQuery = query.trim().toLowerCase();

  // Dynamic categories with "All" option at the start
  const allCategoryChips = useMemo<MenuCategoryChip[]>(() => {
    const allLabel = t.menu.filters.all ?? (locale === "ar" ? "الكل" : "All");

    if (categories && categories.length > 0) {
      return [
        { id: "all", label: allLabel, count: products.length },
        ...categories,
      ];
    }

    // Fallback: extract dynamically from products
    const map = new Map<string, { id: string; label: string; count: number }>();
    for (const p of products) {
      const catId = p.filterKey;
      if (!map.has(catId)) {
        map.set(catId, {
          id: catId,
          label: p.categoryLabel,
          count: 0,
        });
      }
      map.get(catId)!.count += 1;
    }

    return [
      { id: "all", label: allLabel, count: products.length },
      ...Array.from(map.values()).filter((c) => c.count > 0),
    ];
  }, [categories, products, t.menu.filters.all, locale]);

  // Current active category label for search empty states and headings
  const activeCategoryLabel = useMemo(() => {
    return (
      allCategoryChips.find((c) => c.id === active)?.label ??
      (locale === "ar" ? "الكل" : "All")
    );
  }, [allCategoryChips, active, locale]);

  // Centralized, memoized filtering
  const visible = useMemo(() => {
    // 1. Filter by category
    const byCategory =
      active === "all"
        ? products
        : products.filter((p) => p.filterKey === active);

    // 2. Filter by search query (within selected category)
    if (trimmedQuery.length === 0) return byCategory;

    return byCategory.filter((p) => {
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
    async ({
      product,
      quantity,
      allergies,
      notes,
      selectedVariant,
    }: AddToCartArgs) => {
      if (product.variantId == null) return false;
      setAddingId(product.id);
      try {
        const attributes: { key: string; value: string }[] = [];
        if (selectedVariant) {
          attributes.push({
            key: locale === "ar" ? "الحجم" : "Size Variant",
            value: selectedVariant.title,
          });
        }
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
    [showToast, showSoft, t.menu.addedToCart, locale],
  );

  async function quickAdd(product: MenuProductSerialized) {
    await addToCart({
      product,
      quantity: getQty(product.id),
      allergies: "",
      notes: "",
      selectedVariant:
        product.sizeVariants && product.sizeVariants.length > 0
          ? product.sizeVariants[0]
          : null,
    });
  }

  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-[#426237]/15 bg-white p-12 text-center shadow-sm">
        <p className="text-base font-semibold text-[#426237]">
          {t.menu.noProducts}
        </p>
      </div>
    );
  }

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="space-y-8">
      {/* 1. Search + Category Navigation System */}
      <div className="flex flex-col gap-4">
        {/* Centered Search Bar */}
        <div className="mx-auto w-full max-w-xl">
          <div className="relative">
            <label htmlFor="menu-search-input" className="sr-only">
              {t.menu.searchSr}
            </label>
            <span
              aria-hidden
              className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-[#426237]/55"
            >
              <SearchIcon className="h-4 w-4" />
            </span>
            <input
              id="menu-search-input"
              type="search"
              inputMode="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.menu.searchPlaceholder}
              className="h-12 w-full rounded-full border border-[#426237]/15 bg-white/95 ps-11 pe-11 text-sm text-[#426237] shadow-sm outline-none transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-[#426237]/45 focus:border-[#426237]/40 focus:ring-2 focus:ring-[#426237]/25"
            />
            {query.length > 0 ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t.menu.clearSearch}
                className="absolute end-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#426237]/60 transition-colors hover:bg-[#426237]/10 hover:text-[#426237] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/35"
              >
                <ClearIcon className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Quick-search category chips: dynamically generated & horizontally scrollable on mobile */}
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
          <div
            role="tablist"
            aria-label={locale === "ar" ? "أقسام المنيو" : "Menu categories"}
            className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1.5 sm:flex-wrap sm:justify-center sm:gap-2.5"
          >
            {allCategoryChips.map((cat) => {
              const isOn = active === cat.id;
              return (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={isOn}
                  type="button"
                  onClick={() => setActive(cat.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold sm:px-5 sm:py-2.5 sm:text-sm transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/35 focus-visible:ring-offset-2 active:scale-[0.97] ${
                    isOn
                      ? "bg-[#426237] text-white shadow-md ring-1 ring-[#426237]"
                      : "bg-white/95 text-[#426237] ring-1 ring-[#426237]/15 hover:bg-white hover:ring-[#426237]/30 shadow-sm"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`ms-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] tabular-nums font-bold ${
                      isOn
                        ? "bg-white/20 text-white"
                        : "bg-[#426237]/10 text-[#426237]/80"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active search / filter live status */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          {trimmedQuery.length > 0 ? (
            <p
              className="text-xs font-semibold text-[#426237]/80"
              aria-live="polite"
            >
              {visible.length === 0
                ? `${t.menu.noMatchesFor} "${query}" ${
                    active !== "all"
                      ? locale === "ar"
                        ? `في قسم ${activeCategoryLabel}`
                        : `in ${activeCategoryLabel}`
                      : ""
                  }`
                : `${visible.length} ${
                    visible.length === 1 ? t.menu.result : t.menu.results
                  } "${query}" ${
                    active !== "all"
                      ? locale === "ar"
                        ? `في قسم ${activeCategoryLabel}`
                        : `in ${activeCategoryLabel}`
                      : ""
                  }`}
            </p>
          ) : active !== "all" ? (
            <p className="text-xs font-medium text-[#426237]/70">
              {locale === "ar"
                ? `عرض ${visible.length} وجبة في قسم "${activeCategoryLabel}"`
                : `Showing ${visible.length} meals in "${activeCategoryLabel}"`}
            </p>
          ) : (
            <p className="text-xs font-medium text-[#426237]/60">
              {locale === "ar"
                ? `عرض جميع الوجبات (${products.length})`
                : `Showing all ${products.length} meals`}
            </p>
          )}

          {(trimmedQuery.length > 0 || active !== "all") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActive("all");
              }}
              className="text-xs font-semibold text-[#426237]/75 hover:text-[#426237] hover:underline underline-offset-2"
            >
              {locale === "ar" ? "إعادة ضبط الفلاتر" : "Reset all filters"}
            </button>
          )}
        </div>
      </div>

      {/* 2. Products Grid or Contextual Empty State */}
      {visible.length === 0 ? (
        <div className="rounded-3xl border border-[#426237]/15 bg-white/95 p-8 sm:p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f1eb] text-[#426237]">
            <SearchIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-[#426237] sm:text-lg">
            {trimmedQuery.length > 0
              ? locale === "ar"
                ? "مفيش نتائج تطابق بحثك"
                : "No matching meals found"
              : t.menu.emptyCategory}
          </h3>
          <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
            {trimmedQuery.length > 0
              ? active !== "all"
                ? locale === "ar"
                  ? `مفيش نتائج لـ "${query}" في قسم "${activeCategoryLabel}". جرّب البحث في كل الأقسام أو امسح البحث.`
                  : `No meals matched "${query}" in ${activeCategoryLabel}. Try searching in all categories or clear the search.`
                : t.menu.noMatches
              : locale === "ar"
                ? "لسه مفيش وجبات في التصنيف ده، اختر تصنيف تاني أو تصفح الكل."
                : "There are no meals in this category right now. Browse other categories or view all."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {active !== "all" && (
              <button
                type="button"
                onClick={() => setActive("all")}
                className="rounded-full bg-[#426237] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#2c4224]"
              >
                {locale === "ar" ? "عرض كل الأصناف" : "View All Meals"}
              </button>
            )}
            {trimmedQuery.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-full border border-[#426237]/25 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#426237] shadow-sm transition hover:bg-[#f4f1eb]"
              >
                {t.menu.clearSearch}
              </button>
            )}
          </div>
        </div>
      ) : (
        <ul
          id="menu-grid"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 sm:gap-8"
        >
          {visible.map((product) => (
            <li key={product.id} className="h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#426237]/10 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-lg">
                {/* Product Image */}
                <ProductCardImage
                  images={product.images}
                  fallbackUrl={product.imageUrl}
                  fallbackAlt={product.imageAlt}
                  categoryLabel={product.categoryLabel}
                  onOpenDetails={() => setDetailProduct(product)}
                  locale={locale}
                />

                {/* Card Content - Strict Hierarchical Layout:
                    1. Product Name
                    2. Price
                    3. Calories
                    4. Macros
                    5. Category / metadata
                    6. Description
                */}
                <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
                  {/* 1. Product Name */}
                  <button
                    type="button"
                    onClick={() => setDetailProduct(product)}
                    className="text-start outline-none transition-colors group/title focus-visible:ring-2 focus-visible:ring-[#426237]/35 rounded-lg"
                  >
                    <h2 className="text-base sm:text-lg font-bold leading-snug tracking-tight text-[#426237] group-hover/title:underline decoration-[#426237]/40 underline-offset-4 line-clamp-2 min-h-[2.75rem]">
                      {product.title}
                    </h2>
                  </button>

                  {/* 2. Price + Serving / Portion metadata */}
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="text-xl font-black tabular-nums text-[#2c4224]">
                      {product.priceLabel}
                    </span>
                    {product.portionPlain ? (
                      <span className="text-[11px] font-semibold text-[#ac8058] bg-[#f4f1eb] px-2 py-0.5 rounded-md ring-1 ring-[#426237]/10">
                        {product.portionPlain}
                      </span>
                    ) : null}
                  </div>

                  {/* 3 & 4. Calories + Normalized Macros (Visual Block) */}
                  {(product.cal !== "—" || product.unifiedMacros !== "—") ? (
                    <div className="mt-3.5 rounded-xl border border-[#426237]/10 bg-[#f4f1eb]/70 p-2.5 text-[#426237]">
                      {product.cal !== "—" ? (
                        <div className="flex items-center gap-1.5 text-xs font-black text-[#2c4224]">
                          <span aria-hidden>🔥</span>
                          <span>{product.cal}</span>
                        </div>
                      ) : null}
                      {product.unifiedMacros !== "—" ? (
                        <p className="mt-1 text-[11px] font-semibold tracking-tight text-[#426237]/80 sm:text-xs">
                          {product.unifiedMacros}
                        </p>
                      ) : null}
                      {product.servingNote ? (
                        <p className="mt-1.5 border-t border-[#426237]/10 pt-1.5 text-[10.5px] font-medium leading-tight text-[#426237]/75">
                          {product.servingNote}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {/* 5. Relevant metadata (e.g. Size variants pill) */}
                  {product.sizeVariants && product.sizeVariants.length > 1 ? (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-[#426237]/75">
                      <span className="inline-flex items-center rounded-md bg-white px-2 py-0.5 ring-1 ring-[#426237]/15">
                        {locale === "ar"
                          ? `متوفر بـ ${product.sizeVariants.length} خيارات`
                          : `${product.sizeVariants.length} sizes available`}
                      </span>
                    </div>
                  ) : null}

                  {/* 6. Description (clean 1-2 line clamped snippet, no bulky accordion) */}
                  {product.descriptionPlain &&
                  product.descriptionPlain !== product.title ? (
                    <p className="mt-3 text-xs leading-relaxed text-gray-600 line-clamp-2 min-h-[2rem]">
                      {product.descriptionPlain}
                    </p>
                  ) : (
                    <div className="mt-3 min-h-[2rem]" aria-hidden />
                  )}

                  {/* Card Footer: Stepper + Add Button + Details Trigger */}
                  <div className="mt-auto pt-5">
                    <div className="flex items-center justify-between gap-3">
                      {/* Quantity Stepper with accessible touch targets */}
                      <div className="flex items-center rounded-full border border-[#426237]/20 bg-[#f4f1eb]/80 p-0.5 shadow-inner">
                        <button
                          type="button"
                          onClick={() =>
                            setQtyByProduct((prev) => ({
                              ...prev,
                              [product.id]: Math.max(
                                1,
                                (prev[product.id] ?? 1) - 1,
                              ),
                            }))
                          }
                          disabled={getQty(product.id) <= 1}
                          aria-label={
                            locale === "ar" ? "تقليل الكمية" : "Decrease quantity"
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold text-[#426237] hover:bg-white transition disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold tabular-nums text-[#426237]">
                          {getQty(product.id)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQtyByProduct((prev) => ({
                              ...prev,
                              [product.id]: Math.min(
                                99,
                                (prev[product.id] ?? 1) + 1,
                              ),
                            }))
                          }
                          aria-label={
                            locale === "ar" ? "زيادة الكمية" : "Increase quantity"
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold text-[#426237] hover:bg-white transition active:scale-95"
                        >
                          +
                        </button>
                      </div>

                      {/* Primary Add to Cart Button */}
                      {product.variantId != null ? (
                        <button
                          type="button"
                          disabled={addingId === product.id}
                          onClick={() => void quickAdd(product)}
                          aria-busy={addingId === product.id}
                          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#426237] px-4 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#2c4224] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/45 disabled:cursor-not-allowed disabled:bg-[#426237]/50 active:scale-[0.97]"
                        >
                          {addingId === product.id ? (
                            <InlineSpinner className="text-white" />
                          ) : (
                            t.menu.add
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="flex h-11 flex-1 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-400 cursor-not-allowed"
                        >
                          {locale === "ar" ? "غير متاح" : "Unavailable"}
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setDetailProduct(product)}
                      className="mt-2.5 w-full text-center text-[11px] font-semibold text-[#426237]/75 hover:text-[#426237] hover:underline underline-offset-2 transition"
                    >
                      {locale === "ar"
                        ? "المكونات، الحساسية والتفاصيل ←"
                        : "Ingredients, allergies & details →"}
                    </button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {/* 3. Product Details & Customization Modal */}
      <ProductDetailsDialog
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onAddToCart={async (args) => {
          const ok = await addToCart(args);
          if (ok) setDetailProduct(null);
          return ok;
        }}
        isAdding={detailProduct != null && addingId === detailProduct.id}
        locale={locale}
      />
    </div>
  );
}

function ProductCardImageSlide({ url, alt }: { url: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const setImgRef = useCallback((img: HTMLImageElement | null) => {
    imgRef.current = img;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

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
        ref={setImgRef}
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
  locale,
}: {
  images: { url: string; alt: string }[];
  fallbackUrl: string | null;
  fallbackAlt: string;
  categoryLabel: string;
  onOpenDetails: () => void;
  locale: Locale;
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
        aria-label={locale === "ar" ? "عرض تفاصيل المنتج" : "View product details"}
      >
        {current != null ? (
          <ProductCardImageSlide key={current.url} url={current.url} alt={current.alt} />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-center text-xs font-medium tracking-wide text-[#426237]/35">
              {locale === "ar" ? "الصورة قريباً" : "Image coming soon"}
            </p>
          </div>
        )}
      </button>

      <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-[#426237] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
        {categoryLabel}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#426237] opacity-0 ring-1 ring-[#426237]/10 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
        {locale === "ar" ? "عرض التفاصيل" : "View details"}
      </span>

      {canBrowse ? (
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/45 to-transparent px-2 pb-2 pt-8">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#426237] shadow-sm ring-1 ring-[#426237]/15 transition-[background-color,transform] duration-150 ease-out hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/30 active:scale-[0.97]"
            aria-label={locale === "ar" ? "الصورة السابقة" : "Previous photo"}
          >
            <ChevronIcon dir="left" className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={shuffle}
            className="flex h-9 min-w-[5.5rem] items-center justify-center gap-1.5 rounded-full bg-white/90 px-3 text-xs font-semibold text-[#426237] shadow-sm ring-1 ring-[#426237]/15 transition-[background-color,transform] duration-150 ease-out hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/30 active:scale-[0.97]"
            aria-label={locale === "ar" ? "تبديل إلى صورة عشوائية" : "Shuffle to a random photo"}
          >
            <ShuffleIcon className="h-4 w-4 shrink-0" />
            {locale === "ar" ? "تبديل" : "Shuffle"}
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#426237] shadow-sm ring-1 ring-[#426237]/15 transition-[background-color,transform] duration-150 ease-out hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/30 active:scale-[0.97]"
            aria-label={locale === "ar" ? "الصورة التالية" : "Next photo"}
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
  const [selectedVariant, setSelectedVariant] =
    useState<MenuProductVariantSerialized | null>(null);
  const [mounted, setMounted] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);

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
    if (!isOpen || product == null) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setQty(1);
    setAllergies("");
    setNotes("");
    setImageIdx(0);
    setSelectedVariant(
      product.sizeVariants && product.sizeVariants.length > 0
        ? product.sizeVariants[0]
        : null,
    );
    contentScrollRef.current?.scrollTo({ top: 0 });
    /* eslint-enable react-hooks/set-state-in-effect */
    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen, product?.id, product]);

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

  const displayPrice = selectedVariant
    ? selectedVariant.priceLabel
    : product.priceLabel;
  const displayCal = selectedVariant ? selectedVariant.cal : product.cal;
  const displayMacros = selectedVariant
    ? formatUnifiedMacros(
        selectedVariant.pro,
        selectedVariant.carb,
        selectedVariant.fat,
        locale,
      )
    : product.unifiedMacros;

  const panel = (
    <div
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="fixed inset-0 z-[1100] flex items-end justify-center px-4 py-5 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={product.title}
    >
      <button
        type="button"
        onClick={onClose}
        className="bb-modal-backdrop absolute inset-0 bg-[#1a1a1a]/55 backdrop-blur-[3px]"
        aria-label={locale === "ar" ? "إغلاق تفاصيل المنتج" : "Close product details"}
        style={{ animation: "bb-modal-fade 220ms ease-out" }}
      />

      <div
        className="bb-modal-panel relative flex max-h-[calc(100dvh-2.5rem)] w-full max-w-[min(100%,27rem)] flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-2xl ring-1 ring-[#426237]/15 sm:max-h-[calc(100dvh-3rem)] sm:max-w-[min(100%,58rem)] sm:rounded-[2rem] lg:max-w-[min(92vw,58rem)]"
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
            aria-label={locale === "ar" ? "إغلاق" : "Close"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#426237] shadow-sm ring-1 ring-[#426237]/12 transition-[background-color,transform] duration-150 ease-out hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/35 active:scale-[0.97]"
          >
            <ClearIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
          <div className="relative min-w-0 shrink-0 bg-[#f4f1eb] max-lg:h-[clamp(9.5rem,34dvh,14rem)] lg:min-h-0">
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
                  {locale === "ar" ? "الصورة قريباً" : "Image coming soon"}
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

          <div
            ref={contentScrollRef}
            className="flex min-h-0 min-w-0 flex-col gap-6 overflow-y-auto overscroll-contain px-6 pb-[max(2.25rem,env(safe-area-inset-bottom))] pt-8 [scrollbar-gutter:stable] sm:gap-7 sm:px-9 sm:pb-12 sm:pt-11 lg:gap-7 lg:px-8 lg:pb-10 lg:pt-10"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ac8058]">
                  {product.categoryLabel}
                </p>
                {product.portionPlain ? (
                  <span className="text-[11px] font-semibold text-[#ac8058] bg-[#f4f1eb] px-2.5 py-0.5 rounded-md ring-1 ring-[#426237]/10">
                    {product.portionPlain}
                  </span>
                ) : null}
              </div>
              <h2 className="menu-serif text-2xl font-bold leading-tight text-[#426237] sm:text-3xl">
                {product.title}
              </h2>
              <p className="text-2xl font-black tabular-nums text-[#2c4224]">
                {displayPrice}
              </p>
            </div>

            {/* Size Variants Selector */}
            {product.sizeVariants && product.sizeVariants.length > 0 ? (
              <div className="space-y-2.5 rounded-2xl border border-[#426237]/15 bg-[#f4f1eb]/80 p-4">
                <span className="block text-xs font-bold uppercase tracking-wider text-[#426237]">
                  {locale === "ar" ? "اختر الحجم / الوجبة" : "Select Portion / Size"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.sizeVariants.map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                          isSelected
                            ? "bg-[#426237] text-white shadow-md ring-1 ring-[#426237]"
                            : "bg-white text-[#426237] ring-1 ring-[#426237]/20 hover:bg-[#f4f1eb]"
                        }`}
                      >
                        {variant.title} ({variant.priceLabel})
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Ingredients Display */}
            {product.ingredientsPlain ? (
              <details className="min-w-0 rounded-xl bg-[#f4f1eb]/60 px-4 py-3.5 ring-1 ring-[#426237]/10 sm:px-5 sm:py-4">
                <summary className="cursor-pointer text-sm font-semibold text-[#426237]">
                  {locale === "ar" ? "المكونات" : "Ingredients"}
                </summary>
                <p className="mt-2.5 break-words text-xs leading-relaxed text-gray-600 sm:text-sm">
                  {product.ingredientsPlain}
                </p>
              </details>
            ) : null}

            {/* Normalized Nutrition Information Box */}
            {(displayCal !== "—" || displayMacros !== "—") ? (
              <div className="rounded-2xl border border-[#426237]/15 bg-[#f4f1eb] p-4 text-[#426237] shadow-sm">
                <div className="flex items-center justify-between gap-2 border-b border-[#426237]/10 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#426237]">
                    {locale === "ar" ? "القيمة الغذائية" : "Nutrition Facts"}
                  </span>
                  {displayCal !== "—" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#426237]/10 px-2.5 py-1 text-xs font-black text-[#2c4224] ring-1 ring-[#426237]/20">
                      🔥 {displayCal}
                    </span>
                  ) : null}
                </div>
                {displayMacros !== "—" ? (
                  <p className="mt-2.5 text-xs sm:text-sm font-semibold text-[#426237]/90">
                    {displayMacros}
                  </p>
                ) : null}
                {product.servingNote ? (
                  <p className="mt-2.5 border-t border-[#426237]/10 pt-2 text-xs font-medium text-[#426237]/80 leading-relaxed">
                    {product.servingNote}
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* Allergies and Special Requests */}
            <div className="flex min-w-0 flex-col gap-5 rounded-2xl border border-amber-200/70 bg-amber-50/50 p-5 sm:gap-4 sm:p-5 lg:p-5">
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
                  {locale === "ar"
                    ? "في أي حساسية لازم نعرفها؟"
                    : "Any allergies we should know?"}
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
                  placeholder={
                    locale === "ar"
                      ? "مثلاً: حساسية من الفول السوداني أو الجمبري"
                      : "e.g. Allergic to peanuts and shellfish"
                  }
                  className="mt-1 w-full rounded-xl border border-[#426237]/15 bg-white px-3.5 py-2.5 text-sm text-[#426237] outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-[#426237]/40 focus:ring-2 focus:ring-[#426237]/25 sm:px-4 sm:py-3"
                />
              </div>

              <div className="border-t border-amber-200/60 pt-4">
                <label
                  htmlFor={`notes-${product.id}`}
                  className="text-sm font-semibold text-[#426237]"
                >
                  {locale === "ar"
                    ? "طلبات خاصة (اختياري)"
                    : "Special requests (optional)"}
                </label>
                <textarea
                  id={`notes-${product.id}`}
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value.slice(0, MAX_ALLERGY_LENGTH))
                  }
                  rows={2}
                  maxLength={MAX_ALLERGY_LENGTH}
                  placeholder={
                    locale === "ar"
                      ? "مثلاً: شطة أقل، الصوص على جنب"
                      : "e.g. Less spicy, extra sauce on the side"
                  }
                  className="mt-2 w-full rounded-xl border border-[#426237]/15 bg-white px-3.5 py-2.5 text-sm text-[#426237] outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-[#426237]/40 focus:ring-2 focus:ring-[#426237]/25 sm:px-4 sm:py-3"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-auto flex flex-col gap-4 border-t border-[#426237]/10 pt-6 sm:flex-row sm:items-center sm:gap-5 sm:pt-7">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-xs font-medium uppercase tracking-wide">
                  {locale === "ar" ? "الكمية" : "Qty"}
                </span>
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
                      selectedVariant,
                    })
                  }
                  aria-busy={isAdding}
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#426237] px-6 text-sm font-semibold text-white shadow-[0_14px_36px_-20px_rgba(66,98,55,0.65)] transition-[background-color,box-shadow,transform,opacity] duration-200 ease-out hover:bg-[#2c4224] hover:shadow-[0_18px_40px_-18px_rgba(66,98,55,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-[#426237]/45 disabled:text-white/90 disabled:shadow-none active:scale-[0.97]"
                >
                  {isAdding ? (
                    <>
                      <InlineSpinner className="text-white" />
                      <span>{locale === "ar" ? "جاري الإضافة…" : "Adding…"}</span>
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
                  {locale === "ar" ? "غير متاح" : "Unavailable"}
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="m20 20-3.2-3.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
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
