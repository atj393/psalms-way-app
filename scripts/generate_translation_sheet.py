"""
generate_translation_sheet.py
------------------------------
Generates a CSV file ready to paste into Google Sheets.
Column A = i18n key, Column B = English value,
Columns C onward = =GOOGLETRANSLATE($B{row},"en","{lang}") formulas.

Once pasted in Google Sheets the formulas auto-resolve (~30 seconds).
Download as CSV → run import_translation_sheet.py to write back to JSON.

Usage:
    python scripts/generate_translation_sheet.py               # missing keys only
    python scripts/generate_translation_sheet.py --force       # all keys
    python scripts/generate_translation_sheet.py --lang de,fr  # specific languages
    python scripts/generate_translation_sheet.py --out my.csv  # custom output path
"""

import csv
import json
import argparse
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR  = Path(__file__).parent
LOCALES_DIR = SCRIPT_DIR.parent / "i18n" / "locales"
EN_FILE     = LOCALES_DIR / "en.json"
DEFAULT_OUT = SCRIPT_DIR / "translations_sheet.csv"

# ── Keys that should NEVER be translated ──────────────────────────────────────
DO_NOT_TRANSLATE = {"appName"}

# ── File code → GOOGLETRANSLATE language code ─────────────────────────────────
# "bo" (Tibetan) is intentionally omitted — not supported by GOOGLETRANSLATE.
LANG_MAP: dict[str, str] = {
    "af": "af",
    "ar": "ar",
    "bn": "bn",
    "cs": "cs",
    "de": "de",
    "es": "es",
    "fa": "fa",
    "fi": "fi",
    "fr": "fr",
    "gu": "gu",
    "ha": "ha",
    "he": "iw",     # Google uses "iw" for Hebrew
    "hi": "hi",
    "ht": "ht",
    "hu": "hu",
    "id": "id",
    "it": "it",
    "ja": "ja",
    "kn": "kn",
    "ko": "ko",
    "lt": "lt",
    "lv": "lv",
    "mi": "mi",
    "ml": "ml",
    "mr": "mr",
    "my": "my",
    "ne": "ne",
    "nl": "nl",
    "pa": "pa",
    "pl": "pl",
    "pt": "pt",
    "ro": "ro",
    "ru": "ru",
    "so": "so",
    "sq": "sq",
    "ta": "ta",
    "te": "te",
    "th": "th",
    "tl": "tl",
    "tr": "tr",
    "ug": "ug",
    "ur": "ur",
    "vi": "vi",
    "wo": "wo",
    "zh": "zh-CN",
}


def load_json(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main():
    parser = argparse.ArgumentParser(description="Generate Google Sheets translation CSV")
    parser.add_argument("--force", action="store_true",
                        help="Include ALL keys, not just missing ones")
    parser.add_argument("--lang", default=None,
                        help="Comma-separated language codes to include (e.g. de,fr,es)")
    parser.add_argument("--out", default=str(DEFAULT_OUT),
                        help=f"Output CSV path (default: {DEFAULT_OUT})")
    args = parser.parse_args()

    en_data: dict = load_json(EN_FILE)
    print(f"Loaded en.json — {len(en_data)} keys")

    # Decide which languages to include
    if args.lang:
        lang_codes = [c.strip() for c in args.lang.split(",")]
        lang_map = {c: LANG_MAP[c] for c in lang_codes if c in LANG_MAP}
        unknown = [c for c in lang_codes if c not in LANG_MAP]
        if unknown:
            print(f"WARNING: Unknown/unsupported language codes ignored: {unknown}")
    else:
        lang_map = LANG_MAP

    # For --missing-only mode, find which keys each locale is missing
    if not args.force:
        missing_per_lang: dict[str, set] = {}
        for file_code in lang_map:
            locale_file = LOCALES_DIR / f"{file_code}.json"
            existing = load_json(locale_file) if locale_file.exists() else {}
            missing_per_lang[file_code] = {
                k for k in en_data
                if k not in existing and k not in DO_NOT_TRANSLATE
            }
        # Only include a key if at least one locale is missing it
        keys_to_include = [
            k for k in en_data
            if any(k in missing_per_lang[c] for c in lang_map)
            and isinstance(en_data[k], str)
            and en_data[k].strip()
        ]
    else:
        keys_to_include = [
            k for k in en_data
            if k not in DO_NOT_TRANSLATE
            and isinstance(en_data[k], str)
            and en_data[k].strip()
        ]

    if not keys_to_include:
        print("No keys to translate — all locales are up to date!")
        return

    print(f"Keys to include: {len(keys_to_include)}")
    print(f"Languages: {list(lang_map.keys())}")

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Write CSV
    # Header row: key, en, de, fr, es, ...
    header = ["key", "en"] + list(lang_map.keys())

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)

        for row_idx, key in enumerate(keys_to_include, start=2):  # row 2 = first data row
            en_value = en_data[key]

            row = [key, en_value]

            for file_code, google_code in lang_map.items():
                if args.force:
                    # Always put formula
                    formula = f'=GOOGLETRANSLATE($B{row_idx},"en","{google_code}")'
                else:
                    # Only put formula if this locale is missing this key
                    if key in missing_per_lang.get(file_code, set()):
                        formula = f'=GOOGLETRANSLATE($B{row_idx},"en","{google_code}")'
                    else:
                        # Key already exists — leave blank so import script skips it
                        formula = ""
                row.append(formula)

            writer.writerow(row)

    print(f"\nCSV written to: {out_path}")
    print(f"Rows: {len(keys_to_include)} keys × {len(lang_map)} languages")
    print()
    print("Next steps:")
    print("  1. Open Google Sheets → File → Import → Upload → select the CSV")
    print("  2. Choose 'Replace spreadsheet' and separator 'Comma'")
    print("  3. Wait ~30 seconds for GOOGLETRANSLATE formulas to resolve")
    print("  4. File → Download → Comma Separated Values (.csv)")
    print(f"  5. Save the downloaded file as: {SCRIPT_DIR / 'translations_sheet_filled.csv'}")
    print("  6. Run: python scripts/import_translation_sheet.py")


if __name__ == "__main__":
    main()
