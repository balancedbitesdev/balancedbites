# -*- coding: utf-8 -*-
"""
Split Shopify CSV rows that use Option variants into separate simple products (one SKU per row).

Currently handles: protein-jar (Flavor option → protein-jar-chocolate, etc.)
Other multi-row handles are extra images only (Title + Default Title) — left unchanged.

Body copy for Protein Jar flavors is from website comments.pptx (slide 10), normalized to HTML.
"""
from __future__ import annotations

import csv
import re
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# Owner-style copy from website comments.pptx slide 10 (ingredients + serving per jar).
PROTEIN_JAR_HTML: dict[str, str] = {
    "Chocolate": (
        "<h2>Protein Jar — Chocolate</h2>"
        "<p><strong>Ingredients:</strong> Cottage cheese, sugar-free chocolate, stevia, monk fruit, "
        "erythritol, almond flour.</p>"
        "<p><strong>Serving per jar:</strong> Protein 22g | Carbs 37g | Fat 30g.</p>"
    ),
    "Pistachio": (
        "<h2>Protein Jar — Pistachio</h2>"
        "<p><strong>Ingredients:</strong> Cottage cheese, pistachio butter, stevia, monk fruit, "
        "erythritol, almond flour.</p>"
        "<p><strong>Serving per jar:</strong> Protein 19g | Carbs 15g | Fat 24g.</p>"
    ),
    "Strawberry": (
        "<h2>Protein Jar — Strawberry</h2>"
        "<p><strong>Ingredients:</strong> Cottage cheese, strawberry, stevia, monk fruit, "
        "erythritol, almond flour.</p>"
        "<p><strong>Serving per jar:</strong> Protein 13g | Carbs 10g | Fat 4g.</p>"
    ),
    "Blueberry": (
        "<h2>Protein Jar — Blueberry</h2>"
        "<p><strong>Ingredients:</strong> Cottage cheese, blueberry, stevia, monk fruit, "
        "erythritol, almond flour.</p>"
        "<p><strong>Serving per jar:</strong> Protein 15g | Carbs 8g | Fat 2.4g.</p>"
    ),
}


def slug_flavor(name: str) -> str:
    s = name.lower().strip().replace(" ", "-")
    return re.sub(r"[^a-z0-9\-]", "", s)


def split_protein_jar(rows: list[dict], fieldnames: list[str]) -> list[dict]:
    """Replace protein-jar variant block with four standalone products."""
    out: list[dict] = []
    i = 0
    while i < len(rows):
        row = rows[i]
        handle = (row.get("Handle") or "").strip()
        opt_name = (row.get("Option1 Name") or "").strip()

        if handle == "protein-jar" and opt_name == "Flavor":
            block: list[dict] = []
            while i < len(rows) and (rows[i].get("Handle") or "").strip() == "protein-jar":
                block.append(rows[i])
                i += 1

            first = block[0]
            vendor = (first.get("Vendor") or "").strip() or "Balanced Bites"
            pcat = (first.get("Product Category") or "").strip()
            ptype = (first.get("Type") or "").strip() or "Dessert"

            for vr in block:
                flavor = (vr.get("Option1 Value") or "").strip()
                if not flavor:
                    continue
                nh = f"protein-jar-{slug_flavor(flavor)}"
                new_r = deepcopy(vr)
                new_r["Handle"] = nh
                new_r["Title"] = f"Protein Jar — {flavor}"
                new_r["Vendor"] = vendor
                new_r["Product Category"] = pcat
                new_r["Type"] = ptype
                new_r["Body (HTML)"] = PROTEIN_JAR_HTML.get(
                    flavor,
                    f"<h2>Protein Jar — {flavor}</h2>",
                )
                new_r["Tags"] = "keto, protein, protein jar, " + flavor.lower()
                new_r["Option1 Name"] = "Title"
                new_r["Option1 Value"] = "Default Title"
                new_r["Option2 Name"] = ""
                new_r["Option2 Value"] = ""
                new_r["Option3 Name"] = ""
                new_r["Option3 Value"] = ""
                # Single image: first relevant URL
                img = (vr.get("Image Src") or "").strip() or (vr.get("Variant Image") or "").strip()
                new_r["Image Src"] = img
                new_r["Image Position"] = "1"
                new_r["Image Alt Text"] = f"Protein Jar — {flavor}"
                new_r["Variant Image"] = ""
                sku_base = nh.upper().replace("-", "")[:20]
                new_r["Variant SKU"] = sku_base
                out.append(new_r)
            continue

        out.append(row)
        i += 1

    return out


def process_file(path: Path) -> None:
    with path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        if not fieldnames:
            raise SystemExit("No headers")
        rows = list(reader)

    new_rows = split_protein_jar(rows, fieldnames)

    with path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(new_rows)

    prim = sum(1 for r in new_rows if (r.get("Title") or "").strip())
    print(f"Updated {path.name}: {len(rows)} -> {len(new_rows)} rows | primary rows: {prim}")


def main() -> None:
    p = ROOT / "products_export_deduped.csv"
    if p.exists():
        process_file(p)
    else:
        print("Skip (missing):", p.name)


if __name__ == "__main__":
    main()
