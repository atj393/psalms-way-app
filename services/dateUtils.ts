/**
 * Pure date helpers shared by the streak, challenge and notification code.
 *
 * Everything here works on the device's LOCAL calendar day. That matters:
 * `new Date().toISOString().split('T')[0]` — which this module replaces —
 * yields the UTC day, so a user in UTC+13 rolls over to "tomorrow" at 11:00
 * local, and a user in UTC-8 stays on "yesterday" until 16:00 local. Streaks
 * and once-per-day gates are product concepts anchored to the user's own
 * midnight, so they must use the local day.
 *
 * These functions take an explicit `now` so tests can pin the clock.
 */

/** A local calendar day in 'YYYY-MM-DD' form. */
export type DateKey = string;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Formats a Date as its LOCAL calendar day, 'YYYY-MM-DD'. */
export function toDateKey(date: Date = new Date()): DateKey {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Today's local calendar day. */
export function todayKey(now: Date = new Date()): DateKey {
  return toDateKey(now);
}

/**
 * Parses 'YYYY-MM-DD' into local midnight of that day.
 *
 * `new Date('2026-01-01')` parses as UTC midnight, which shifts the day for
 * most of the world; the explicit constructor below stays local.
 */
export function parseDateKey(key: DateKey): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day, 0, 0, 0, 0);
  // Reject values that rolled over (e.g. 2026-02-31 → March 3).
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return d;
}

/**
 * Whole local days from `a` to `b` (positive when `b` is later).
 *
 * Both keys are anchored to local midnight before subtracting, so a DST
 * transition in between (a 23- or 25-hour day) still counts as exactly one
 * day rather than 0.958 or 1.042 rounding into the wrong bucket.
 */
export function daysBetween(a: DateKey, b: DateKey): number | null {
  const da = parseDateKey(a);
  const db = parseDateKey(b);
  if (!da || !db) return null;
  // Compare using UTC-normalised midnights so the offset change cancels out.
  const ua = Date.UTC(da.getFullYear(), da.getMonth(), da.getDate());
  const ub = Date.UTC(db.getFullYear(), db.getMonth(), db.getDate());
  return Math.round((ub - ua) / 86400000);
}

/** Returns a new DateKey `n` local days after `key`. */
export function addDays(key: DateKey, n: number): DateKey | null {
  const d = parseDateKey(key);
  if (!d) return null;
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

/**
 * The next local wall-clock occurrence of `hour:minute`, strictly after `from`.
 *
 * Uses setHours on a local Date, so it follows the device's DST rules: if the
 * target time does not exist on a spring-forward day the platform normalises
 * it forward, which is the desired "fire once that morning" behaviour.
 */
export function nextOccurrence(hour: number, minute: number, from: Date = new Date()): Date {
  const t = new Date(from.getTime());
  t.setHours(hour, minute, 0, 0);
  if (t.getTime() <= from.getTime()) {
    t.setDate(t.getDate() + 1);
  }
  return t;
}

/**
 * The local wall-clock time of `hour:minute` on the given day.
 * Used to place each day of a rolling notification window.
 */
export function occurrenceOn(key: DateKey, hour: number, minute: number): Date | null {
  const d = parseDateKey(key);
  if (!d) return null;
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** True when `hour` and `minute` form a valid wall-clock time. */
export function isValidTime(hour: number, minute: number): boolean {
  return (
    Number.isInteger(hour) &&
    Number.isInteger(minute) &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  );
}
