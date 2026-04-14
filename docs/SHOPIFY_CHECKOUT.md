# Shopify checkout: delivery fee & taxes

## Delivery fee (50 EGP, adjustable)

**The amount customers pay at checkout is controlled in Shopify**, not only in this app.

1. **Shopify Admin** → **Settings** → **Shipping and delivery**.
2. Open your **General shipping** profile (or the profile used for Egypt).
3. Under **Shipping zones**, add or edit the zone that includes your customers (e.g. Egypt).
4. Add a **rate**: **Flat rate** → name e.g. “Delivery” → **50 EGP** (or whatever matches `NEXT_PUBLIC_DELIVERY_FEE_EGP` in Vercel / `.env.local`).

Keeping the **same number** in Admin and in `NEXT_PUBLIC_DELIVERY_FEE_EGP` avoids confusion between the cart estimate and checkout.

To change the fee later: update **both** the shipping rate in Shopify and the env var, then redeploy (env change only if you use Vercel env vars).

---

## Why taxes appear on Shopify checkout

Shopify calculates **sales tax / VAT** when:

- **Tax collection** is turned on for the customer’s country, and  
- Product prices are **tax-exclusive** (tax is added at checkout), or  
- **Markets** and **tax registrations** require it.

So a separate “Tax” line is normal unless you configure pricing to be **tax-inclusive**.

---

## How to avoid showing tax as a separate line (options)

### A) Include tax in the product price (common for B2C)

1. **Settings** → **Taxes and duties**.
2. For your market (e.g. Egypt), review **Collect tax** and whether prices are **including tax**.
3. **Settings** → **Markets** → select market → ensure **Price includes tax** / inclusive pricing is set the way you want (wording varies by Shopify version).

When prices are **tax-inclusive**, checkout often shows **one total** without a scary extra tax line (depends on theme and region).

### B) Turn off tax collection (only if legally allowed)

If you are **not** required to collect tax in a region, you can disable tax collection for that region in **Settings** → **Taxes and duties**. **Confirm with your accountant** before changing this.

### C) Shopify Plus / Checkout customization

Advanced: **checkout UI extensions** or **Plus** features can change how lines display; still must comply with tax law.

---

## This codebase

- `NEXT_PUBLIC_DELIVERY_FEE_EGP` — cart **estimate** only; **checkout total** = Shopify (items + shipping + tax − discounts).
- Cart UI shows **Subtotal** (items from Shopify) + **Delivery** (your flat fee) + **Estimated total** for **EGP** carts.

### Cart after login / sign-up

After OAuth completes, the app calls Storefront **`cartBuyerIdentityUpdate`** with the customer’s **email** (from the Customer Account API) so the **same cart** stays attached to their session and checkout. The `bb_cart_id` cookie is refreshed if Shopify returns an updated cart id. If identity update fails, the existing cart cookie is left as-is so items are not dropped.
