# -*- coding: utf-8 -*-
"""
Build import-ready Shopify CSV from deduped export:
  Primary rows: Published=true, Status=active
  Continuation rows (extra images / variants): Published & Status empty (Shopify convention)
"""
from __future__ import annotations

import csv
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
INPUT_CSV = ROOT / "products_export_deduped.csv"
OUTPUT_CSV = ROOT / "balanced_bites_shopify_import_ready.csv"


def main() -> None:
    # Split variant-style rows (e.g. Protein Jar flavors) into separate products first.
    if INPUT_CSV.exists():
        from split_variant_products import process_file as split_variants

        split_variants(INPUT_CSV)

    with INPUT_CSV.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        if not fieldnames:
            raise SystemExit("Missing headers")
        rows = list(reader)

    out: list[dict] = []
    for row in rows:
        title = (row.get("Title") or "").strip()
        handle = (row.get("Handle") or "").strip()
        is_primary = bool(title and handle)

        if "Published" not in row:
            row["Published"] = ""
        if "Status" not in row:
            row["Status"] = ""

        if is_primary:
            row["Published"] = "true"
            row["Status"] = "active"
        else:
            row["Published"] = ""
            row["Status"] = ""

        out.append(row)

    with OUTPUT_CSV.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(out)

    prim = sum(1 for row in out if (row.get("Title") or "").strip())
    print(f"Wrote {OUTPUT_CSV}")
    print(f"Total rows: {len(out)} | Primary product rows: {prim}")

    types = Counter()
    for row in out:
        if not (row.get("Title") or "").strip():
            continue
        types[(row.get("Type") or "").strip() or "(empty)"] += 1
    print("Primary rows by Type:", dict(types))


if __name__ == "__main__":
    main()
