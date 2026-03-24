"""
translate_workflow.py
=====================
Interactive step-by-step translation workflow guide.
Run this file instead of the individual scripts — it walks you through
everything and runs the other scripts automatically at the right time.

Usage:
    python scripts/translate_workflow.py
"""

import subprocess
import sys
import os
import json
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR       = Path(__file__).parent
LOCALES_DIR      = SCRIPT_DIR.parent / "i18n" / "locales"
EN_FILE          = LOCALES_DIR / "en.json"
SHEET_CSV        = SCRIPT_DIR / "translations_sheet.csv"
FILLED_CSV       = SCRIPT_DIR / "translations_sheet_filled.csv"
GENERATE_SCRIPT  = SCRIPT_DIR / "generate_translation_sheet.py"
IMPORT_SCRIPT    = SCRIPT_DIR / "import_translation_sheet.py"

# ── Terminal colours ──────────────────────────────────────────────────────────
class C:
    RESET  = "\033[0m"
    BOLD   = "\033[1m"
    CYAN   = "\033[96m"
    GREEN  = "\033[92m"
    YELLOW = "\033[93m"
    RED    = "\033[91m"
    DIM    = "\033[2m"
    WHITE  = "\033[97m"

def c(color: str, text: str) -> str:
    return f"{color}{text}{C.RESET}"

def box(title: str, color: str = C.CYAN) -> None:
    width = 60
    print()
    print(c(color, "─" * width))
    print(c(color + C.BOLD, f"  {title}"))
    print(c(color, "─" * width))

def step(number: int, title: str) -> None:
    print()
    print(c(C.BOLD + C.WHITE, f"  STEP {number}  ") + c(C.BOLD, title))
    print(c(C.DIM, "  " + "·" * 50))

def info(text: str) -> None:
    for line in text.strip().splitlines():
        print(c(C.DIM, "  ") + line)

def success(text: str) -> None:
    print(c(C.GREEN, f"  ✓  {text}"))

def warn(text: str) -> None:
    print(c(C.YELLOW, f"  !  {text}"))

def error(text: str) -> None:
    print(c(C.RED, f"  ✗  {text}"))

def prompt(text: str) -> str:
    return input(c(C.CYAN + C.BOLD, f"\n  → {text}: ")).strip()

def confirm(text: str) -> bool:
    answer = input(c(C.CYAN + C.BOLD, f"\n  → {text} [y/n]: ")).strip().lower()
    return answer in ("y", "yes", "")

def run_script(script: Path, *args: str) -> bool:
    """Run a Python script with the same interpreter. Returns True if successful."""
    cmd = [sys.executable, str(script)] + list(args)
    print(c(C.DIM, f"\n  Running: {' '.join(cmd)}\n"))
    result = subprocess.run(cmd, cwd=str(SCRIPT_DIR.parent))
    return result.returncode == 0

def count_missing_keys() -> dict[str, int]:
    """Return {lang_code: missing_count} for all locale files."""
    if not EN_FILE.exists():
        return {}
    with open(EN_FILE, encoding="utf-8") as f:
        en_data = json.load(f)
    missing: dict[str, int] = {}
    for locale_file in sorted(LOCALES_DIR.glob("*.json")):
        if locale_file.stem == "en":
            continue
        with open(locale_file, encoding="utf-8") as f:
            locale_data = json.load(f)
        missing_count = sum(1 for k in en_data if k not in locale_data)
        if missing_count > 0:
            missing[locale_file.stem] = missing_count
    return missing

# ══════════════════════════════════════════════════════════════════════════════
#  Main workflow
# ══════════════════════════════════════════════════════════════════════════════

def main():
    # ── Welcome ────────────────────────────────────────────────────────────────
    box("  Psalms Way — Translation Workflow", C.CYAN)
    print()
    print("  This guide will walk you through translating all missing keys")
    print("  in your i18n locale files using Google Sheets' free")
    print("  GOOGLETRANSLATE function.")
    print()
    print("  No API key needed. No cost. Works 100% free.")
    print()
    print(c(C.DIM, "  Press Ctrl+C at any time to exit."))

    # ── Show current status ────────────────────────────────────────────────────
    box("  Current Status", C.YELLOW)
    missing = count_missing_keys()
    if not missing:
        success("All locale files are up to date — nothing to translate!")
        print()
        if not confirm("Run anyway (e.g. to re-translate with --force)?"):
            print()
            print("  Nothing to do. Exiting.")
            print()
            return
        force_mode = True
    else:
        total_missing = sum(missing.values())
        print(f"\n  {c(C.BOLD, str(len(missing)))} language file(s) have missing keys:")
        for lang, count in sorted(missing.items()):
            print(f"    {c(C.YELLOW, lang.ljust(6))}  {count} key(s) missing")
        print(f"\n  {c(C.BOLD, str(total_missing))} total missing translations")
        force_mode = False

    # ── Ask for options ────────────────────────────────────────────────────────
    box("  Options", C.DIM)

    lang_filter = prompt(
        "Translate specific languages only? (e.g. de,fr,es) — or press Enter for ALL"
    )

    if not force_mode:
        force_mode = confirm("Re-translate ALL keys (overwrite existing)?")

    # ─────────────────────────────────────────────────────────────────────────
    #  STEP 1 — Generate CSV
    # ─────────────────────────────────────────────────────────────────────────
    box("  STEP 1 of 4 — Generate CSV", C.CYAN)
    step(1, "Generate the Google Sheets CSV file")
    print()
    info("""
This creates a CSV file where:
  · Column A = i18n key name
  · Column B = English text (source)
  · Columns C onward = =GOOGLETRANSLATE() formulas, one per language

File will be saved to:
""")
    print(f"  {c(C.GREEN, str(SHEET_CSV))}")
    print()

    if not confirm("Generate CSV now?"):
        print()
        warn("Skipped. If you already have the CSV, continue to Step 2.")

    else:
        args = []
        if force_mode:
            args.append("--force")
        if lang_filter:
            args += ["--lang", lang_filter]

        ok = run_script(GENERATE_SCRIPT, *args)
        if ok and SHEET_CSV.exists():
            success(f"CSV generated successfully!")
            print(f"\n  {c(C.BOLD, 'File location:')}")
            print(f"  {c(C.GREEN, str(SHEET_CSV))}")
        else:
            error("CSV generation failed. Check the output above for errors.")
            if not confirm("Continue anyway?"):
                return

    # ─────────────────────────────────────────────────────────────────────────
    #  STEP 2 — Google Sheets
    # ─────────────────────────────────────────────────────────────────────────
    box("  STEP 2 of 4 — Open in Google Sheets", C.CYAN)
    step(2, "Open the CSV in Google Sheets")
    print()
    info("""
Follow these steps in your browser:

  1.  Go to  https://sheets.google.com
  2.  Click  File  →  Import
  3.  Click  Upload  →  select the CSV file:
""")
    print(f"      {c(C.GREEN, str(SHEET_CSV))}")
    print()
    info("""
  4.  Import settings:
        · Import location:  Replace spreadsheet
        · Separator type:   Comma

  5.  Click  Import data

  6.  Wait 30–60 seconds for all GOOGLETRANSLATE formulas to resolve.
      You will see foreign language text appear in the columns.

  NOTE: If a cell still shows  #N/A  after 60 seconds, the language
        may not be supported — that is okay, the import script will
        skip blank/error cells.
""")

    input(c(C.CYAN + C.BOLD, "  → Press Enter when all formulas have resolved in Google Sheets..."))

    # ─────────────────────────────────────────────────────────────────────────
    #  STEP 3 — Download filled CSV
    # ─────────────────────────────────────────────────────────────────────────
    box("  STEP 3 of 4 — Download the filled CSV", C.CYAN)
    step(3, "Download the filled CSV from Google Sheets")
    print()
    info("""
In Google Sheets:

  1.  Click  File  →  Download  →  Comma Separated Values (.csv)

  2.  Save the file with this exact name in this exact folder:
""")
    print(f"      {c(C.GREEN, str(FILLED_CSV))}")
    print()
    info("  (You can rename the downloaded file and move it to that location.)")
    print()

    # Wait for the file to exist
    while True:
        if FILLED_CSV.exists():
            success(f"Found:  {FILLED_CSV.name}")
            break
        input(c(C.CYAN + C.BOLD,
                f"  → File not found yet. Save it then press Enter to check again..."))

    # ─────────────────────────────────────────────────────────────────────────
    #  STEP 4 — Import back to JSON
    # ─────────────────────────────────────────────────────────────────────────
    box("  STEP 4 of 4 — Import translations to JSON files", C.CYAN)
    step(4, "Write translations back to locale JSON files")
    print()
    info("""
This reads every row of the filled CSV and writes the translated values
into the matching locale .json file in i18n/locales/.

  · Existing translations are preserved (not overwritten).
  · Blank cells (unsupported languages) are skipped.
  · Key order follows en.json exactly.
""")

    if not confirm("Import now?"):
        warn("Skipped.")
    else:
        args = []
        if force_mode:
            args.append("--force")
        if lang_filter:
            args += ["--lang", lang_filter]
        args += ["--input", str(FILLED_CSV)]

        ok = run_script(IMPORT_SCRIPT, *args)
        if ok:
            success("Import complete!")
        else:
            error("Import encountered errors. Check the output above.")

    # ── Final status ──────────────────────────────────────────────────────────
    box("  Final Status", C.GREEN)
    missing_after = count_missing_keys()
    if not missing_after:
        success("All locale files are fully translated!")
    else:
        total = sum(missing_after.values())
        warn(f"{total} key(s) still missing across {len(missing_after)} file(s):")
        for lang, count in sorted(missing_after.items()):
            print(f"    {c(C.YELLOW, lang.ljust(6))}  {count} key(s) still missing")
        print()
        info("""
  Possible reasons for remaining missing keys:
    · The GOOGLETRANSLATE formula returned #N/A (unsupported language)
    · The cell was blank when you downloaded the CSV
    · You filtered to specific languages with --lang

  To retry, run this workflow again.
""")

    print()
    print(c(C.DIM, "  Workflow complete. Run this script again any time new keys are added."))
    print()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print()
        print()
        warn("Workflow cancelled by user.")
        print()
