/**
 * Shared AsyncStorage helpers for the personal-data services.
 *
 * Two problems this solves.
 *
 * 1. Lost updates. Every service was written as `load()` → mutate → `save()`,
 *    which is a read-modify-write with an await in the middle. Two overlapping
 *    calls — a double-tapped bookmark button, or a bookmark toggle racing a
 *    highlight write — both read the same starting array and the second write
 *    silently discards the first. `withKeyLock` serialises operations per key
 *    so each one observes the previous one's result.
 *
 * 2. Untrusted stored JSON. `JSON.parse(raw) as Bookmark[]` is a lie the
 *    compiler cannot check: the value may be from an older schema, hand-edited,
 *    or truncated by an interrupted write. `readJson` takes a validator and
 *    falls back rather than letting malformed rows reach the UI.
 *
 * Writes deliberately reject on failure instead of swallowing the error. A
 * failed save means the user's note or bookmark did not persist, and callers
 * need the chance to say so.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Per-key promise chain. Each queued operation waits for the previous one on
 * the same key, so read-modify-write sequences cannot interleave.
 *
 * Entries are removed once the chain drains, so this cannot grow unbounded.
 */
const locks = new Map<string, Promise<unknown>>();

export function withKeyLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();

  // `prev.then(fn, fn)` runs regardless of whether the predecessor resolved or
  // rejected: one failed write must not stall every later operation on the key.
  const run = prev.then(fn, fn);

  // The value stored in the map is a tail that never rejects, so the next
  // caller chaining onto it cannot inherit this one's failure. The real `run`
  // is what the caller gets, so the error still surfaces exactly once.
  const gate = run.then(
    () => undefined,
    () => undefined,
  );
  locks.set(key, gate);

  void gate.then(() => {
    // Only clear when nothing newer has queued behind us, so the map does not
    // grow without bound but an in-flight chain is never dropped.
    if (locks.get(key) === gate) locks.delete(key);
  });

  return run;
}

/**
 * Reads and validates a stored JSON value.
 *
 * `validate` returns the narrowed value, or null when the stored shape is not
 * usable. Anything unusable — missing, unparseable, or rejected — yields
 * `fallback`.
 */
export async function readJson<T>(
  key: string,
  validate: (value: unknown) => T | null,
  fallback: T,
): Promise<T> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(key);
  } catch (err) {
    console.warn(`[storage] Failed to read "${key}":`, err);
    return fallback;
  }
  if (raw == null) return fallback;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn(`[storage] Discarding unparseable JSON at "${key}"`);
    return fallback;
  }

  const validated = validate(parsed);
  if (validated === null) {
    console.warn(`[storage] Discarding unexpected shape at "${key}"`);
    return fallback;
  }
  return validated;
}

/** Writes a JSON value. Rejects if the write fails. */
export async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// ─── Small validation helpers ─────────────────────────────────────────────────

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A psalm chapter number, 1–150. */
export function isChapter(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 150;
}

/** A 1-based verse number. */
export function isVerseNumber(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1;
}

/**
 * Filters an unknown value to the array items that pass `item`.
 *
 * Rows are dropped individually rather than failing the whole list: one corrupt
 * bookmark should not discard the other forty-nine.
 */
export function asFilteredArray<T>(
  value: unknown,
  item: (candidate: unknown) => T | null,
): T[] | null {
  if (!Array.isArray(value)) return null;
  const out: T[] = [];
  for (const candidate of value) {
    const parsed = item(candidate);
    if (parsed !== null) out.push(parsed);
  }
  return out;
}
