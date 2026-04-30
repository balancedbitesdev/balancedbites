"""Replace Shopify file URLs with clean CDN filenames (no UUID query params)."""

from __future__ import annotations

import csv
import sys
from pathlib import Path

BASE = "https://cdn.shopify.com/s/files/1/0720/3592/6147/files/"


def u(filename: str) -> str:
    return BASE + filename


# (handle, image_position) -> full Image Src URL
REPLACEMENTS: dict[tuple[str, str], str] = {
    # Prepared meals (WhatsApp photos)
    ("chicken-mushroom-stroganoff", "1"): u("IMG-20260415-WA0025.jpg"),
    ("classic-beef-stroganoff", "1"): u("IMG-20260415-WA0026.jpg"),
    ("butter-chicken", "1"): u("IMG-20260415-WA0027.jpg"),
    ("beef-shawarma", "1"): u("IMG-20260415-WA0028.jpg"),
    ("doner-kabab", "1"): u("IMG-20260415-WA0029.jpg"),
    ("dawood-basha-kofta", "1"): u("IMG-20260415-WA0030.jpg"),
    ("chicken-fajita", "1"): u("IMG-20260415-WA0031.jpg"),
    ("chicken-shish-tawook", "1"): u("IMG-20260415-WA0032.jpg"),
    ("keto-chicken-sweet-and-sour", "1"): u("IMG-20260415-WA0033.jpg"),
    ("keto-swedish-meatball", "1"): u("IMG-20260415-WA0034.jpg"),
    ("stuffed-bell-peppers", "1"): u("IMG-20260415-WA0035.jpg"),
    ("roasted-potatoes-zucchini-carrots", "1"): u("IMG-20260415-WA0037.jpg"),
    ("cheesy-baked-chicken-meatballs", "1"): u("IMG-20260415-WA0041.jpg"),
    ("cheesy-baked-chicken-meatballs", "2"): u("IMG-20260415-WA0042.jpg"),
    # Sides / salads (studio PNGs + WA extras)
    ("mixed-cabbage-salad-beetroot-carrot", "1"): u("Mixed_Cabbage_Salad_With_Beetroot_Carrot.png"),
    ("creamy-beetroot-hummus-tahini", "1"): u("Creamy_Beetroot_Hummus_With_Tahini.png"),
    ("boiled-sweet-potato", "1"): u("Boiled_Sweet_Potato.png"),
    ("grilled-sweet-potato-whole", "1"): u("Grilled_Sweet_Potato.png"),
    ("grilled-sweet-potato-whole", "2"): u("IMG-20260415-WA0040.jpg"),
    ("grilled-sweet-potato-fingers", "1"): u("Grilled_Sweet_Potato_fingers.png"),
    ("grilled-sweet-potato-fingers", "2"): u("IMG-20260415-WA0039.jpg"),
    ("baked-potatoes", "1"): u("Baked_Potatoes.png"),
    ("baked-potatoes", "2"): u("IMG-20260415-WA0036.jpg"),
    ("seasonal-sauteed-vegetables", "1"): u("Seasonal_Sauteed_Vegetables.png"),
    ("seasonal-sauteed-vegetables", "2"): u("IMG-20260415-WA0038.jpg"),
    ("grilled-chicken-caesar-salad", "1"): u("Grilled_Chicken_Caesar_Salad.png"),
    ("rocca-salad", "1"): u("Rocca_Salad.png"),
    ("steamed-egyptian-white-rice", "1"): u("Steamed_Egyptian_White_Rice.png"),
    ("basmati-rice", "1"): u("Basmati_Rice.png"),
    # Desserts (legacy handles)
    ("basbosa", "1"): u("Basbosa_-_Basbosa_2_pieces.jpg"),
    ("basbosa", "2"): u("Basbosa_-_Basbosa_plate.jpg"),
    ("basbosa", "3"): u("Basbosa_-_Basbosa.jpg"),
    ("coconut-truffles", "1"): u("Truffles_-_Coconut_Truffles.jpg"),
    ("chocolate-truffles", "1"): u("Truffles_-_Chocolate_Truffles.jpg"),
    ("cereal", "1"): u("Cereal_-_Cereal_Jar.jpg"),
    ("cereal", "2"): u("Cereal_-_Cereal.jpg"),
    ("brownies", "1"): u("Brownies_-_Brownies_Bites.jpg"),
    ("brownies", "2"): u("Brownies_-_Brownies.jpg"),
    ("lazy-cake", "1"): u("Cake_-_Chocolate_Cake_-_Lazy_Cake_Bar.jpg"),
    ("lazy-cake", "2"): u("Cake_-_Chocolate_Cake_-_Lazy_Cake_Bites.jpg"),
    ("chocolate-cupcake", "1"): u("Cake_-_Chocolate_Cake_-_Chocolate_Cupcake.jpg"),
    ("peanut-butter-tart", "1"): u("Pennut_Butter_Tart_-_Pennut_Butter_Chocolate_Tart_Bites.jpg"),
    ("peanut-butter-tart", "2"): u("Pennut_Butter_Tart_-_Pennut_Butter_Chocolate_Tart.jpg"),
    # Split protein jars
    ("protein-jar-chocolate", "1"): u("Protein_Jars_-_Chocolate.jpg"),
    ("protein-jar-pistachio", "1"): u("Protein_Jars_-_Pistachio.jpg"),
    ("protein-jar-strawberry", "1"): u("Protein_Jars_-_Strawbierries.jpg"),
    ("protein-jar-blueberry", "1"): u("Protein_Jars_-_Blueberries.jpg"),
    # Protein catalog (were missing images in export)
    ("protein-birthday-cake-chocolate", "1"): u("Cake_-_Chocolate_Cake_-_Chocolate_round_cake.jpg"),
    ("protein-birthday-cake-almond-vanilla", "1"): u("Cake_-_Almond_Cake_-_Almond_Cake.jpg"),
    ("protein-chocolate-cookies", "1"): u("Cookies_-_Chocolate_Cookies.jpg"),
    ("protein-chocolate-chip-cookies", "1"): u("Cookies_-_Cookies_with_Cranberries.jpg"),
    ("protein-vanilla-cupcake", "1"): u("Cake_-_Almond_Cake_-_Almond_Cupcake.png"),
}


def patch_csv(path: Path) -> int:
    with path.open(newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
        fieldnames = list(rows[0].keys()) if rows else []

    current_handle = ""
    changed = 0
    for row in rows:
        h = (row.get("Handle") or "").strip()
        if h:
            current_handle = h
        pos = (row.get("Image Position") or "1").strip() or "1"
        key = (current_handle, pos)
        if key not in REPLACEMENTS:
            continue
        new_url = REPLACEMENTS[key]
        old = (row.get("Image Src") or "").strip()
        old_pos = (row.get("Image Position") or "").strip()
        if old != new_url:
            row["Image Src"] = new_url
            changed += 1
        if old_pos != pos:
            row["Image Position"] = pos
            changed += 1

    with path.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)

    return changed


def main() -> None:
    root = Path(__file__).resolve().parent
    targets = [
        root / "balanced_bites_shopify_import_ready.csv",
        root / "products_export_deduped.csv",
    ]
    for p in targets:
        if not p.exists():
            print(f"skip (missing): {p}", file=sys.stderr)
            continue
        n = patch_csv(p)
        print(f"{p.name}: updated {n} image field(s) (Src and/or Position)")


if __name__ == "__main__":
    main()
