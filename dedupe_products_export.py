# -*- coding: utf-8 -*-
"""
Deduplicate Shopify products_export CSV: same dish under multiple handles.
Prefers rows with images; ties favor catalog handles with owner nutrition text in Body.

References: WhatsApp chat + website comments.pptx meal/dessert lists.
"""
from __future__ import annotations

import csv
import re
from collections import defaultdict
from pathlib import Path

CSV_IN = Path(__file__).resolve().parent / "products_export_1.csv"
CSV_OUT = Path(__file__).resolve().parent / "products_export_deduped.csv"
AUDIT_OUT = Path(__file__).resolve().parent / "products_export_audit.txt"

# Duplicate clusters: each tuple lists handles that refer to the same offering (per chat/PPTX overlap).
# Order does not matter; winner is chosen by score(), not list order.
# When both handles exist, prefer the canonical handle below (fixes mis-labeled legacy SKUs).
FORCED_WINNER: dict[frozenset[str], str] = {
    frozenset({"chocolate-chip-cookies", "protein-chocolate-chip-cookies"}): "protein-chocolate-chip-cookies",
}

DUPLICATE_GROUPS: tuple[frozenset[str], ...] = (
    frozenset({"chicken-stroganoff", "chicken-mushroom-stroganoff"}),
    frozenset({"doner-kebab", "doner-kabab"}),
    frozenset(
        {
            "mixed-cabbage-salad-with-beetroot-and-carrot",
            "mixed-cabbage-salad-beetroot-carrot",
        }
    ),
    frozenset({"creamy-beetroot-hummus-with-tahini", "creamy-beetroot-hummus-tahini"}),
    frozenset({"boiled-sweet-potatoes", "boiled-sweet-potato"}),
    # Generic plural grilled SP vs specific SKUs in chat — drop generic duplicate only
    # PPTX "Grilled Sweet Potatoes" duplicates whole-potato SKU; fingers stay separate.
    frozenset({"grilled-sweet-potatoes", "grilled-sweet-potato-whole"}),
    frozenset({"stuffed-bell-peppers-beef-chicken", "stuffed-bell-peppers"}),
    frozenset({"beef-meatballs-dawood-basha", "dawood-basha-kofta"}),
    frozenset({"keto-swedish-meatballs", "keto-swedish-meatball"}),
    frozenset({"shish-tawook", "chicken-shish-tawook"}),
    frozenset({"chocolate-chip-cookies", "protein-chocolate-chip-cookies"}),
    frozenset({"chocolate-cupcake", "protein-chocolate-cupcake"}),
    frozenset({"vanilla-cupcake", "protein-vanilla-cupcake"}),
    frozenset({"lazy-cake", "protein-lazy-cake"}),
    frozenset({"brownies", "protein-brownies"}),
    frozenset({"peanut-butter-tart", "protein-peanut-butter-tart"}),
    frozenset({"basbosa", "protein-basbousa"}),
    frozenset({"coconut-truffles", "protein-coconut-truffle"}),
)


def has_macros_in_body(body: str) -> bool:
    if not body:
        return False
    b = body.lower()
    if re.search(r"\b(cal|kcal|protein|carb|fat)\b[^<]{0,40}\d", b):
        return True
    if re.search(r"\b(pro|carb)\s*[\d.\s\-]+", b):
        return True
    return False


def metafields_filled(row: dict) -> bool:
    for k in row:
        if "metafields.custom" in k and (row.get(k) or "").strip():
            return True
    return False


def image_rows(rows: list[dict]) -> int:
    return sum(1 for r in rows if (r.get("Image Src") or "").strip().startswith("http"))


def score_handle(handle: str, rows: list[dict]) -> float:
    primary = rows[0] if rows else {}
    body = primary.get("Body (HTML)") or ""
    imgs = image_rows(rows)
    score = imgs * 1000.0
    if has_macros_in_body(body):
        score += 500.0
    if metafields_filled(primary):
        score += 200.0
    if handle.startswith("protein-"):
        score += 100.0
    # Prefer WhatsApp import naming for mains/sides
    if handle.startswith("IMG-") is False and "WA" in (primary.get("Image Src") or ""):
        score += 50.0
    return score


def load_csv(path: Path) -> tuple[list[str], list[dict]]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        r = csv.DictReader(f)
        rows = list(r)
        return r.fieldnames or [], rows


def main() -> None:
    fieldnames, rows = load_csv(CSV_IN)
    if not fieldnames:
        raise SystemExit("Empty CSV")

    by_handle: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        h = (row.get("Handle") or "").strip()
        if h:
            by_handle[h].append(row)

    # Build handle -> duplicate group
    handle_to_group: dict[str, frozenset[str]] = {}
    for g in DUPLICATE_GROUPS:
        for h in g:
            handle_to_group[h] = g

    winners: dict[frozenset[str], str] = {}
    for g in DUPLICATE_GROUPS:
        present = [h for h in g if h in by_handle]
        if len(present) < 2:
            continue
        if g in FORCED_WINNER and FORCED_WINNER[g] in present:
            winners[g] = FORCED_WINNER[g]
        else:
            winners[g] = max(present, key=lambda h: (score_handle(h, by_handle[h]), h))

    drop_handles: set[str] = set()
    for g, win in winners.items():
        for h in g:
            if h != win:
                drop_handles.add(h)

    kept_rows: list[dict] = []
    for row in rows:
        h = (row.get("Handle") or "").strip()
        if h and h in drop_handles:
            continue
        kept_rows.append(row)

    with CSV_OUT.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(kept_rows)

    # Audit
    lines: list[str] = []
    lines.append("Balanced Bites — products export deduplication audit")
    lines.append(f"Input: {CSV_IN.name}  |  Output: {CSV_OUT.name}")
    lines.append("")
    lines.append("=== DUPLICATE RESOLUTION (dropped → kept) ===")
    for g, win in sorted(winners.items(), key=lambda x: x[1]):
        losers = sorted([h for h in g if h != win and h in by_handle])
        if not losers:
            continue
        forced = g in FORCED_WINNER and FORCED_WINNER[g] == win
        tag = " [forced canonical]" if forced else ""
        lines.append(f"Kept: {win}{tag}")
        for l in losers:
            lines.append(f"  Dropped: {l}")
    lines.append("")
    lines.append("=== FLAGS: remaining products (missing image or macros) ===")
    lines.append(
        "Macros = nutrition numbers in Body HTML OR any product metafield (carbs/fats/protein/ingredients)."
    )
    lines.append("")

    seen: set[str] = set()
    for row in kept_rows:
        h = (row.get("Handle") or "").strip()
        if not h or h in seen:
            continue
        seen.add(h)
        grp = by_handle.get(h, [])
        primary = grp[0] if grp else {}
        body = primary.get("Body (HTML)") or ""
        imgs = image_rows(grp)
        mf = metafields_filled(primary)
        macros = has_macros_in_body(body) or mf
        title = (primary.get("Title") or "").strip()

        miss_img = imgs == 0
        miss_mx = not macros
        flags = []
        if miss_img:
            flags.append("NO_IMAGE")
        if miss_mx:
            flags.append("NO_MACROS_OR_METAFIELDS")
        if flags:
            lines.append(f"[{', '.join(flags)}] {h}")
            lines.append(f"    Title: {title}")
        else:
            lines.append(f"[OK] {h}")

    lines.append("")
    lines.append("=== OWNER / COMMENT REFERENCES (for manual QA) ===")
    lines.append(
        "WhatsApp (images + dish names): Chicken Mushroom Stroganoff, Classic Beef Stroganoff, "
        "Butter Chicken, Beef Shawarma, Doner Kebab, Dawood Basha Kofta, Chicken Fajita, "
        "Chicken Shish Tawook, Keto Chicken Sweet and Sour, Keto Swedish Meatball, "
        "Stuffed bell peppers, Baked potatoes, Roasted potatoes zucchini and carrots, "
        "Seasonal sautéed vegetables (+ PNG sides/salads Basmati, Boiled Sweet Potato, etc.)."
    )
    lines.append(
        "website comments.pptx slide 13 — Meals/sides/salads menu lines + items 17–18 "
        "(chicken calzone, classic grilled chicken/meat …)."
    )
    lines.append(
        "website comments.pptx slides 10–12 — Protein Jar flavors + dessert ingredients/macros."
    )
    lines.append("")
    lines.append("=== ITEMS IN WEBSITE COMMENTS (PPTX) NOT IN DUPLICATE SETS ===")
    lines.append(
        "Slide 13 lists: Keto Taco Salad, Creamy Tahini With Sumac, Keto Chicken/Beef Teriyaki, "
        "Chicken Kofta With Caramelized Onions, Chicken Shawarma, etc. Some exist only as legacy "
        "'Meal' placeholders without WhatsApp photos — review manually."
    )
    lines.append("")
    lines.append("website comments.pptx also details Protein Jar flavors with ingredients (slide 10–12).")

    AUDIT_OUT.write_text("\n".join(lines), encoding="utf-8")

    print("Wrote", CSV_OUT)
    print("Wrote", AUDIT_OUT)
    print("Dropped handles:", len(drop_handles))


if __name__ == "__main__":
    main()
