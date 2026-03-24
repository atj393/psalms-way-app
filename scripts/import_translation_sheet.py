"""
import_translation_sheet.py
----------------------------
Reads a filled-in translation CSV (downloaded from Google Sheets after
GOOGLETRANSLATE formulas have resolved) and writes each language column
back to its corresponding locale JSON file.

Usage:
    python scripts/import_translation_sheet.py
    python scripts/import_translation_sheet.py --input my_filled.csv
    python scripts/import_translation_sheet.py --force          # overwrite existing keys too
    python scripts/import_translation_sheet.py --lang de        # update only German
    python scripts/import_translation_sheet.py --dry-run        # preview without writing
"""

import csv
import json
import argparse
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR  = Path(__file__).parent
LOCALES_DIR = SCRIPT_DIR.parent / "i18n" / "locales"
EN_FILE     = LOCALES_DIR / "en.json"
DEFAULT_IN  = SCRIPT_DIR / "translations_sheet_filled.csv"


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data: dict) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main():
    parser = argparse.ArgumentParser(description="Import Google Sheets translations back to JSON")
    parser.add_argument("--input", default=str(DEFAULT_IN),
                        help=f"Input CSV file (default: {DEFAULT_IN})")
    parser.add_argument("--force", action="store_true",
                        help="Overwrite existing translations (default: only fill missing keys)")
    parser.add_argument("--lang", default=None,
                        help="Only update this language code (e.g. de)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print what would change without writing any files")
    args = parser.parse_args()

    in_path = Path(args.input)
    if not in_path.exists():
        print(f"ERROR: Input file not found: {in_path}")
        print("Make sure you downloaded the filled CSV from Google Sheets and saved it there.")
        return

    en_data = load_json(EN_FILE)
    en_keys_ordered = list(en_data.keys())

    # ── Read CSV ───────────────────────────────────────────────────────────────
    with open(in_path, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        print("ERROR: CSV file is empty.")
        return

    header = rows[0]
    data_rows = rows[1:]

    # Header must have at least: key, en, <lang1>, ...
    if len(header) < 3 or header[0].strip().lower() != "key":
        print(f"ERROR: Unexpected header format. Expected first column to be 'key', got: {header[:3]}")
        return

    # Build column index map: lang_code → column index
    lang_cols: dict[str, int] = {}
    for col_idx, col_name in enumerate(header):
        col_name = col_name.strip()
        if col_idx >= 2:  # skip 'key' (0) and 'en' (1)
            lang_cols[col_name] = col_idx

    if args.lang:
        if args.lang not in lang_cols:
            print(f"ERROR: Language '{args.lang}' not found in CSV header.")
            print(f"Available languages in CSV: {list(lang_cols.keys())}")
            return
        lang_cols = {args.lang: lang_cols[args.lang]}

    print(f"CSV: {len(data_rows)} key rows, {len(lang_cols)} language(s): {list(lang_cols.keys())}")
    print()

    # ── Process each language ─────────────────────────────────────────────────
    for lang_code, col_idx in lang_cols.items():
        locale_file = LOCALES_DIR / f"{lang_code}.json"
        existing = load_json(locale_file)

        added   = 0
        skipped = 0
        blank   = 0

        new_values: dict[str, str] = {}

        for row in data_rows:
            if not row:
                continue
            key = row[0].strip()
            if not key:
                continue

            # Get translated value for this language
            if col_idx < len(row):
                translated = row[col_idx].strip()
            else:
                translated = ""

            if not translated:
                blank += 1
                continue  # blank = formula didn't resolve or column was left empty

            # Decide whether to apply
            if key in existing and not args.force:
                skipped += 1
                continue

            new_values[key] = translated
            added += 1

        if added == 0:
            print(f"[{lang_code}] Nothing to update ({skipped} already existed, {blank} blank)")
            continue

        if args.dry_run:
            print(f"[{lang_code}] DRY RUN — would update {added} key(s):")
            for k, v in list(new_values.items())[:5]:
                print(f"    {k}: {v[:60]}")
            if len(new_values) > 5:
                print(f"    ... and {len(new_values) - 5} more")
            continue

        # Merge: existing + new values
        merged = {**existing, **new_values}

        # Re-order to match en.json key order, then append any extras
        ordered: dict[str, str] = {}
        for k in en_keys_ordered:
            if k in merged:
                ordered[k] = merged[k]
        for k in merged:
            if k not in ordered:
                ordered[k] = merged[k]

        save_json(locale_file, ordered)
        print(f"[{lang_code}] Updated {added} key(s)  |  skipped {skipped} existing  |  {blank} blank  |  Total: {len(ordered)} keys")

    print("\nDone.")
    if args.dry_run:
        print("(Dry run — no files were written)")


if __name__ == "__main__":
    main()
