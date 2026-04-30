"use client";

import { useState } from "react";
import { InlineSpinner } from "@/components/balanced-bites/InlineSpinner";
import { useCartDrawer } from "@/components/balanced-bites/CartDrawer";
import { useLocale } from "@/components/balanced-bites/LocaleContext";
import { useToast } from "@/components/balanced-bites/Toast";
import {
  dispatchCartUpdated,
  postCartMutation,
} from "@/lib/cart-client-api";
import type { AccountOrderLineItem } from "@/lib/customer-account-data";

type Props = {
  orderNumber: string;
  lineItems: AccountOrderLineItem[];
};

export function ReorderButton({ orderNumber, lineItems }: Props) {
  const { show: showToast, showSoft } = useToast();
  const { locale } = useLocale();
  const { setOpen: setCartOpen } = useCartDrawer();
  const [pending, setPending] = useState(false);

  const reorderable = lineItems.filter(
    (li) => li.variantId != null && li.variantId.length > 0,
  );
  const disabled = reorderable.length === 0 || pending;

  async function onClick() {
    if (disabled) return;
    setPending(true);
    try {
      const addLines = reorderable.map((li) => ({
        merchandiseId: li.variantId as string,
        quantity: li.quantity,
      }));
      const result = await postCartMutation({
        action: "addBatch",
        addLines,
      });
      if (!result.ok) {
        showSoft(result.error);
        return;
      }
      const skipped = lineItems.length - reorderable.length;
      const baseMsg =
        locale === "ar"
          ? `اتضاف ${reorderable.length} صنف من طلبك`
          : reorderable.length === 1
            ? "Added 1 item from your order"
            : `Added ${reorderable.length} items from your order`;
      showToast(
        skipped > 0
          ? locale === "ar"
            ? `${baseMsg} · ${skipped} صنف مش متاح`
            : `${baseMsg} · ${skipped} item${skipped === 1 ? "" : "s"} unavailable`
          : baseMsg,
      );
      dispatchCartUpdated();
      setCartOpen(true);
    } catch (err) {
      console.error("Reorder failed:", err);
      showSoft(locale === "ar" ? "حصل خطأ. جرّب تاني." : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (reorderable.length === 0) {
    return (
      <span
        className="inline-flex h-9 items-center justify-center rounded-full bg-[#426237]/5 px-3 text-xs font-medium text-[#426237]/45 ring-1 ring-[#426237]/10"
        title={locale === "ar" ? "الأصناف من الطلب ده مش متاحة دلوقتي" : "Items from this order are no longer available"}
      >
        {locale === "ar" ? "مش متاح" : "Unavailable"}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={disabled}
      aria-busy={pending}
      title={
        locale === "ar"
          ? `ضيف أصناف الطلب #${orderNumber} للسلة`
          : `Re-add the items from order #${orderNumber} to your cart`
      }
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#426237] px-4 text-xs font-semibold text-white shadow-[0_10px_24px_-16px_rgba(66,98,55,0.55)] transition-[background-color,box-shadow,transform,opacity] duration-200 ease-out hover:bg-[#2c4224] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-[#426237]/40 active:scale-[0.97]"
    >
      {pending ? (
        <>
          <InlineSpinner className="text-white" />
          <span>{locale === "ar" ? "بنضيف..." : "Adding..."}</span>
        </>
      ) : (
        <>
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            className="h-3.5 w-3.5"
          >
            <path
              d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {locale === "ar" ? "اطلب تاني" : "Order again"}
        </>
      )}
    </button>
  );
}
