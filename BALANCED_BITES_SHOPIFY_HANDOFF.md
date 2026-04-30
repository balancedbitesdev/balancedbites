# Balanced Bites — Shopify catalog handoff

**Purpose:** This document records how the product catalog was built, which files to use for a bulk import, what was changed, and what the business still needs from the owners (Kamal / kitchen / operations) before the store is production-ready.

**Owner-facing checklist (sign-off, missing photos, pricing):** `BALANCED_BITES_OWNER_ACTION_CHECKLIST.md`

**Last updated:** 2026-04-27 (dates in filenames and export metadata may differ).

---

## 1. Deliverables (what to use)

| Deliverable | Path | Role |
|-------------|------|------|
| **Ready-to-import CSV (recommended)** | `balanced_bites_shopify_import_ready.csv` | Single file formatted like your Shopify **product export**, with **Published = true** and **Status = active** on primary rows. Use this for a full-catalog upload or update. |
| Deduped export (pre-activation) | `products_export_deduped.csv` | Same rows as the import-ready file, but with previous **draft / published** flags from export. |
| Original export (before dedupe) | `products_export_1.csv` | Raw snapshot; **not** recommended for import without deduplication. |
| Deduplication script | `dedupe_products_export.py` | Re-runnable logic for removing duplicate **handles** (see §5). |
| Activation script | `prepare_shopify_import_ready.py` | Sets **Published** / **Status** on primary vs continuation rows for `balanced_bites_shopify_import_ready.csv`. Runs **`split_variant_products.py`** first so variant listings become separate products. |
| Variant split | `split_variant_products.py` | Converts **Protein Jar** (`Flavor` option) into four standalone products: `protein-jar-chocolate`, `protein-jar-pistachio`, `protein-jar-strawberry`, `protein-jar-blueberry` (body text from **website comments.pptx** slide 10). |
| Canonical catalog generator | `WhatsApp/build_shopify_csv.py` | Builds `shopify_products_balanced_bites.csv` from WhatsApp copy + CDN map (narrower column set). |
| Audit log | `products_export_audit.txt` | Duplicate winners, **NO_IMAGE** / **NO_MACROS** style flags from the dedupe pass. |
| CDN filename refresh | `patch_cdn_urls.py` | Sets **Image Src** (and **Image Position** where needed) to clean `.../files/<Filename>` URLs on `balanced_bites_shopify_import_ready.csv` and `products_export_deduped.csv`. Run after re-export if handles or filenames change. |
| Owner sign-off | `BALANCED_BITES_OWNER_ACTION_CHECKLIST.md` | Rigorous checklist for owners: **nine** products still missing a main image, pricing, menu truth, metafields. |

**Primary file to upload:** `balanced_bites_shopify_import_ready.csv` (61 data rows, **50** **primary** product rows; remaining rows are **extra images only** — no option variants).

---

## 2. Data sources (lineage)

| Source | What it provided |
|--------|------------------|
| **WhatsApp** (`WhatsApp/WhatsApp Chat with Balanced Bites website.txt`) | Mission copy; “What we use instead”; **protein jar nutrition** lines; **dessert** nutrition and **ingredients** where typed; **dish names** matched to `IMG-20260415-WA0025`…`WA0042` and follow-up PNG filenames. |
| **Shopify product export** (`products_export_1.csv`) | Live (or copied) store state: handles, tags, **metafield column headers**, prices, inventory, `Status`, **Image Src** (Shopify CDN URLs), `protein-jar` options. |
| **website comments.pptx** (from chat) | Slide 10–12: **Protein Jar** flavors, ingredients, per-jar macros; **desserts** (tart, cookies, cakes, etc.) with ingredients and serving text. Slide 13: **meals, sides, salads** list (incl. Keto Taco Salad, tahini with sumac, teriyaki items, “17–18” tail items). |
| **Shopify Files (CDN)** | Public `https://cdn.shopify.com/s/files/1/0720/3592/6147/files/...` URLs. These are **store- and file-specific**; if you change store or re-upload files, URLs must be refreshed in the CSV. |

**Description / ingredients policy in catalog text:** For **desserts**, product **Body (HTML)** where edited from the generator follows **owner-supplied** text (WhatsApp and/or PPTX), with **spelling-only** fixes. For **mains and many sides**, the owner did not provide per-SKU ingredient lists in chat, so many items use a **title-only** description in the import derived from the export (see `products_export_deduped.csv` / import-ready file).

---

## 3. What the pipeline did (technical, in order)

1. **Export**  
   - Starting point: `products_export_1.csv` (full column set including custom metafields: `carbs`, `fats`, `ingredients`, `protein`).

2. **Deduplication** (`dedupe_products_export.py`)  
   - **Problem:** The same dish appeared under two **handles** (e.g. import catalog `protein-*` vs older “Meal” templates, plural/singular, or re-titled products).  
   - **Rule:** Group known duplicates; keep one **handle** per group by scoring **image count**, **nutrition text in body**, **metafields**, and `protein-*` prefix.  
   - **Exception:** `chocolate-chip-cookies` vs `protein-chocolate-chip-cookies` — the legacy row was titled “Chocolate Cookies” for a chocolate-**chip** product, so the **forced** winner is `protein-chocolate-chip-cookies`.  
   - **Output:** `products_export_deduped.csv` (duplicate **handles** removed; **18** handles dropped).  
   - **Detail log:** `products_export_audit.txt`.

3. **Variant split** (`split_variant_products.py`, invoked from `prepare_shopify_import_ready.py`)  
   - **Protein Jar** used **Option1 Name = Flavor** (Chocolate, Pistachio, Strawberry, Blueberry). Those four are now **four separate handles** with **Title / Default Title** only (simple products).  
   - Other multi-row handles (e.g. second **product image**) still use empty **Title** continuation rows — not variants.

4. **Activation** (`prepare_shopify_import_ready.py`)  
   - **Primary row:** Non-empty **Title** and **Handle** → `Published = true`, `Status = active`.  
   - **Continuation row:** Same **Handle**, empty **Title** (extra images only) → **Published** and **Status** cleared.

5. **Parallel artifact** (`WhatsApp/build_shopify_csv.py`)  
   - Produces `shopify_products_balanced_bites.csv` with fewer columns; useful if you only want WhatsApp-aligned rows and CDN URLs. Not required for the **full** store upload described here.

---

## 4. Import-ready CSV — column highlights

The import-ready file preserves Shopify’s export columns, including:

- **Handle** — URL slug; stable IDs for linking and redirects.
- **Body (HTML)** — Product description.
- **Vendor**, **Type**, **Tags**, **Variant Price**, **Variant Inventory Qty**, **Variant SKU**, etc.
- **Image Src**, **Image Position**, **Image Alt Text** — product media; multiple rows per **Handle** for multiple images.
- **Status** — `active` on primary products in the import-ready file.
- **Custom metafields** (headers like `carbs (product.metafields.custom.carbs)`) — present in the file; **values are mostly empty** in the export and must be filled if you use them in the theme.

**Protein Jar:** Four separate products — `protein-jar-chocolate`, `protein-jar-pistachio`, `protein-jar-strawberry`, `protein-jar-blueberry` — each with its own **Image Src**, price, and inventory (copied from the former variant rows).

---

## 5. Deduplication — handles removed (reference)

The following were **dropped** in favor of the “Kept” handle (see `products_export_audit.txt` for the exact list). Do not re-create these unless you intend to split the menu again.

Examples (not exhaustive): `chicken-stroganoff` → `chicken-mushroom-stroganoff`; `doner-kebab` → `doner-kabab`; `vanilla-cupcake` → `protein-vanilla-cupcake`; `basbosa` kept over `protein-basbousa` (images vs owner macro text — see §7).

---

## 6. How to import in Shopify (operator checklist)

1. **Back up**  
   - **Settings → Export** products (or duplicate the theme) before a large replace.

2. **Import**  
   - **Products → Import** → select `balanced_bites_shopify_import_ready.csv`.  
   - Choose **“Overwrite products with matching handles”** if you are updating the **same** store and want existing products replaced.  
   - If this is a **new** store, use “Add new products” and expect new product IDs.

3. **Validate**  
   - Spot-check: **Active** products, **images** load, **prices** and **inventory**, **Protein Jar** options, **tax / shipping** profiles.

4. **Edge cases**  
   - **URLs / SEO:** If handles changed, set **URL redirects** from old product URLs.  
   - **Collections:** Re-attach products to collections if the import cleared them.  
   - **Apps:** Subscriptions, reviews, or loyalty apps may need re-linking to new product IDs if products were deleted and re-imported on the same store.

---

## 7. Gaps and known trade-offs (read before go-live)

| Topic | Situation |
|------|-----------|
| **Images** | **Nine** primary SKUs still have **no** `Image Src` in `balanced_bites_shopify_import_ready.csv` (list in `BALANCED_BITES_OWNER_ACTION_CHECKLIST.md`). Others use CDN URLs refreshed to **clean filenames** via `patch_cdn_urls.py` — owners should still **verify** each photo matches the dish name. |
| **Macros in metafields** | Column headers exist; most **values** are empty. PPTX and WhatsApp contain numbers in **Body** for many desserts; mains/sides often have **title-only** bodies. |
| **Basbosa vs `protein-basbousa`** | Dedupe **kept `basbosa`** (had more images). The draft `protein-basbousa` row (owner nutrition in body) was **dropped**. If you need both photos **and** that body text, **merge manually** in Shopify. |
| **Legacy “Meal” products** (e.g. Keto Beef Teriyaki) | Listed in PPTX; some have **no** WhatsApp photo set. They may be placeholders — confirm with owners before marketing. |
| **CDN URLs** | All `cdn.shopify.com/.../1/0720/3592/6147/...` URLs assume **the same** Shopify store and Files; do not reuse blindly after migrating stores. |
| **Prices** | Many catalog rows still show **0.00** where the export had draft/zero; others retain older prices (e.g. 70, 120, 150). **Owners must confirm** final EGP (or other) pricing. |

---

## 8. What we need from the owners (rigorous checklist)

Use this as a sign-off list before launch.

### A. Menu and positioning

- [ ] Confirm the **final menu** matches **WhatsApp + PPTX** (including whether items **17–18** on slide 13 are live products and their **exact names**).
- [ ] Confirm **Arabic** copy and whether **Arabic storefront / translations** are required (raised in PPTX “Home Page”).
- [ ] Confirm which **legacy “Meal”** items (Keto Taco Salad, Teriyaki lines, etc.) stay **published** vs hidden until photography exists.

### B. Pricing and commercial

- [ ] **Final sell price** per SKU (and per **Protein Jar** flavor if prices differ).
- [ ] **Compare-at** pricing if used.
- [ ] **Bundles**, **minimum order**, **delivery radius**, **pickup** rules (not in CSV).

### C. Nutrition and compliance

- [ ] Approve **all nutrition numbers** in **Body (HTML)** for desserts/protein jars (WhatsApp vs PPTX vs kitchen measurements — resolve any conflict).
- [ ] Decide whether **macros** should live in **Body only** or also in **metafields** for the theme (if metafields are empty, theme code may need updating).
- [ ] **Allergens** and **full ingredient declarations** for statutory compliance (beyond owner bullet lists).

### D. Media

- [ ] Provide or approve **missing product photos** (especially `protein-*` lines without `Image Src`).
- [ ] Confirm **hero / lifestyle** assets for collections and homepage (outside this CSV).

### E. Operations

- [ ] **Stock** and **inventory tracking** (track vs continue selling; prep times if shown on PDP).
- [ ] **SKU / barcode** alignment with kitchen labels if you print tickets.

### F. Technical / Shopify

- [ ] Confirm **one** canonical Shopify store for **Files** URLs (or replace CDN links after migration).
- [ ] After import, review **collections**, **navigation**, and **search** (Arabic if applicable).

---

## 9. Scripts quick reference

```text
# Regenerate deduped export (after editing DUPLICATE_GROUPS in script)
python dedupe_products_export.py

# Regenerate import-ready CSV after updating products_export_deduped.csv
python prepare_shopify_import_ready.py

# Refresh product image URLs to clean CDN filenames (both import-ready and deduped)
python patch_cdn_urls.py

# Regenerate WhatsApp-only narrow CSV (optional; requires WhatsApp/ folder in repo)
python WhatsApp/build_shopify_csv.py
```

---

## 10. Summary counts (import-ready file)

| Metric | Value |
|--------|--------|
| Total CSV rows | 61 |
| Primary product rows (has Title + Handle) | 50 |
| Primary rows by Type (approx.) | Dessert 19, Prepared Meal 12, Side Dish 9, Salad 5, Meal 5 |

*(Meal vs Prepared Meal reflects labels already in the export; you may normalize Type in Shopify later.)*

---

## 11. Sign-off

| Role | Name | Date | Signature |
|------|------|------|-------------|
| Catalog / menu owner | | | |
| Pricing | | | |
| Shopify operator | | | |

---

*End of handoff document.*
