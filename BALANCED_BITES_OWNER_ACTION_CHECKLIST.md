# Balanced Bites — Owner & operations checklist (Shopify catalog)

**Audience:** Owners, kitchen lead, and whoever operates Shopify before and after launch.  
**Companion (technical):** `BALANCED_BITES_SHOPIFY_HANDOFF.md` — how the CSV was built, scripts, and deduplication rules.  
**Last updated:** 2026-04-27.

This document focuses on **what you must verify or supply** so the online catalog matches reality, complies with how you want to present the brand, and does not go live with obvious gaps.

---

## 1. What you should use in Shopify

| Item | Action |
|------|--------|
| **Bulk import file** | Use **`balanced_bites_shopify_import_ready.csv`** at the project root (same folder as this file). |
| **Before any large import** | In Shopify: **Products → Export** (backup). Decide with your developer whether to **overwrite** matching handles or only add new products. |
| **After import** | Spot-check products, images, prices, inventory, collections, and navigation. |

**Catalog shape (current file):** **50** sellable products on “primary” rows (each row has a **Title** and **Handle**). There are **11** extra rows with the same **Handle** but an empty **Title** — those rows exist only to attach **additional photos** (not variants with options).

**Protein Jar:** The store previously used one product with a **Flavor** option. The import file instead has **four separate products**: Chocolate, Pistachio, Strawberry, and Blueberry (`protein-jar-chocolate`, `protein-jar-pistachio`, `protein-jar-strawberry`, `protein-jar-blueberry`). Confirm that matches how you sell and stock them.

---

## 2. Products with **no main photo** (must fix before marketing)

These **nine** products appear in the import file with **no `Image Src`** on their primary row. The storefront will show **no image** (or a generic placeholder, depending on your theme) until you add media.

| # | Handle (URL slug) | Title on storefront | What we need from you |
|---|-------------------|---------------------|-------------------------|
| 1 | `protein-kahk` | Kahk | **Photograph Kahk** (or supply a finished pack shot) and upload in Shopify **or** send the final file URL to whoever updates the CSV. No dedicated Kahk asset was in the last shared file list. |
| 2 | `keto-taco-salad` | Keto Taco Salad | **Photo** and confirm this item is **meant to be sold** (see §4). |
| 3 | `creamy-tahini-with-sumac` | Creamy Tahini with Sumac | **Photo** and confirm sell vs menu-only. |
| 4 | `keto-beef-teriyaki` | Keto Beef Teriyaki | **Photo**; confirm pricing and that it is not a duplicate of another beef dish. |
| 5 | `keto-beef-stroganoff` | Keto Beef Stroganoff | **Photo**; confirm it is distinct from **Classic Beef Stroganoff** on the menu. |
| 6 | `keto-chicken-teriyaki` | Keto Chicken Teriyaki | **Photo**; confirm live vs seasonal. |
| 7 | `chicken-kofta-with-caramelized-onions` | Chicken Kofta with Caramelized Onions | **Photo**; confirm naming matches the plate you serve. |
| 8 | `chicken-shawarma` | Chicken Shawarma | **Photo**; you already have **Beef Shawarma** photographed — ensure chicken is not confused with beef in the image you choose. |
| 9 | `plain-cookies` | Plain Cookies | **Photo**; if “plain” means a specific recipe, the photo should match (not chocolate chip, etc.). |

**How to fix (pick one workflow):**

1. **In Shopify Admin (simplest for a few SKUs):** Products → open the product → **Media** → upload image(s). No CSV required.  
2. **Via a new export/edit/re-import:** Export products, fill **Image Src** for that handle’s primary row (and **Image Position** = `1` on that row), re-import with overwrite for those handles.  
3. **If your team maintains the pipeline:** Add the new public **Files** URL to the mapping in `patch_cdn_urls.py` (or the sheet your developer uses), then regenerate the CSV.

**Image quality bar:** Consistent lighting, readable portion size, and **honest representation** of what the customer receives (especially for desserts and protein items).

---

## 3. Photos that are already linked (quick verification)

Most mains, sides, salads, desserts, and protein jars now point at **clean CDN URLs** (Shopify **Files**), including WhatsApp-style meal photos (`IMG-20260415-WA00xx.jpg`) and renamed studio files (e.g. `Brownies_-_Brownies_Bites.jpg`).

**Your task:** In a **staging** or **password-protected** copy of the store, open each collection or the full catalog and confirm:

- The **photo matches the dish name** (meal photos were assigned by handle; mistakes should be corrected immediately).  
- **Multi-photo** products (second and third rows in the CSV for the same handle) appear in the order you want on the product page.  
- **Alt text:** Some rows have **Image Alt Text** filled (e.g. sides); many dessert rows do not. Filling alt text helps **accessibility** and **SEO** — assign to marketing or ops.

---

## 4. Menu truth — items that look like “templates”

Several products still use **short generic descriptions** (for example, only an `<h2>` title and a line like “High-protein keto meal”) rather than full ingredients or serving notes. That usually means they came from an older **template** row in Shopify or PPTX, not from your latest WhatsApp copy.

**Please decide for each:**

- Is it **on the menu** for customers ordering this week?  
- Should it be **hidden** (draft / unpublish) until copy and photos are ready?  
- Should the **description** be expanded to match how you describe the dish elsewhere (Arabic/English, ingredients, reheating, etc.)?

Handles that especially deserve this review (photos and/or copy often thin):

- `keto-taco-salad`, `creamy-tahini-with-sumac`  
- `keto-beef-teriyaki`, `keto-beef-stroganoff`, `keto-chicken-teriyaki`  
- `chicken-kofta-with-caramelized-onions`, `chicken-shawarma`  
- Some **Uncategorized** desserts (`basbosa`, `coconut-truffles`, `chocolate-truffles`, `cereal`, `brownies`, `lazy-cake`, `chocolate-cupcake`, `peanut-butter-tart`) — titles exist; **Body** may still be minimal compared to your protein-dessert SKUs.

---

## 5. Pricing, inventory, and SKUs

The CSV carries **Variant Price**, **Variant Inventory Qty**, **Variant SKU**, and **Status** (`active` on primary products in the import-ready file). **Do not assume** these match your current board prices or stock.

| Check | Owner action |
|-------|----------------|
| **Price per SKU** | Confirm final **EGP** (or other currency) for every live product, including each **Protein Jar** flavor if prices differ. |
| **Compare-at price** | If you use “was / now” pricing, set it in Admin or in the CSV. |
| **Inventory** | Confirm **track** vs **continue selling when out of stock**, and realistic quantities if you use online stock counts. |
| **SKU / kitchen codes** | Align with labels, tickets, or POS if you use them operationally. |

---

## 6. Nutrition, ingredients, and metafields

- **Body (HTML):** Many **protein desserts** and **protein jars** include macros and/or ingredients in the description, sourced from **WhatsApp** and **website comments (PPTX)** where available. **Mains and many sides** often have **title-only** or short HTML — that reflects missing per-SKU copy in the sources, not an omission by mistake.  
- **Metafield columns** in the CSV (`carbs`, `fats`, `ingredients`, `protein` under `product.metafields.custom.*`): headers are present; **values are mostly empty** in the export. If your **theme** reads these fields for cards or PDP badges, you must either **fill metafields** in Shopify or **change the theme** to read from the description.

**Compliance:** Lists in chat/PPTX are **not** a full allergen or legal food-labeling package. Decide with counsel or your regulator what must appear for your market.

---

## 7. Known catalog decisions (avoid accidental duplicates)

Your technical handoff lists **deduplicated handles** (same dish was once under two URLs). Examples: one canonical **chicken mushroom stroganoff**, one **doner kebab** handle, **protein-chocolate-chip-cookies** kept over a mis-labeled legacy cookie row.

**Basbosa:** The deduped catalog **kept `basbosa`** for richer photos; a separate **`protein-basbousa`** style row with different body text was dropped. If you need **both** photo set and the other wording, **merge manually** in Shopify after import.

**Do not** recreate old duplicate handles unless you intend to split the menu again — that confuses SEO and repeat customers.

---

## 8. Spare files you already uploaded (optional upgrades)

Some files shared on CDN are **not** yet wired to a specific product in the automated mapping (examples: extra cookie stick shot, additional almond cake angles). If you want a **second angle** or **lifestyle** image for a SKU, tell your operator which **handle** should get which **file name**, and they can add a continuation row or upload in Admin.

---

## 9. Sign-off matrix (recommended)

Use this table for internal sign-off before you remove password protection or run ads.

| Area | Question | Owner (name) | Done (date) |
|------|----------|--------------|-------------|
| **Images** | All nine missing-image SKUs resolved **or** products unpublished? | | |
| **Image accuracy** | Spot-check: meal WA photos match dish names? | | |
| **Menu / drafts** | Template “Meal” items either completed or hidden? | | |
| **Pricing** | All prices and compare-at values confirmed? | | |
| **Stock** | Tracking rules and quantities realistic? | | |
| **Copy** | Arabic/English strategy and PDP descriptions approved? | | |
| **Legal / allergens** | Required statements present for your channel? | | |
| **Collections / nav** | Post-import menus and collection membership correct? | | |

---

## 10. Who to contact for CSV changes

If you add **new** products or **rename** handles, your developer (or the person who runs the scripts) should:

1. Refresh **`products_export_1.csv`** from Shopify (or edit **`products_export_deduped.csv`** with care).  
2. Run **`python dedupe_products_export.py`** when duplicates reappear.  
3. Run **`python prepare_shopify_import_ready.py`** to rebuild **`balanced_bites_shopify_import_ready.csv`**.  
4. Run **`python patch_cdn_urls.py`** after uploading new **Files** so CDN links stay consistent with the mapping.

---

*End of owner checklist. For script names, column definitions, and dedupe detail, see `BALANCED_BITES_SHOPIFY_HANDOFF.md`.*
