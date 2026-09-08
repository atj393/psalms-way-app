/**
 * Date helpers underpin the streak, the once-per-day challenge gate and the
 * notification window, so they are tested directly rather than through the UI.
 *
 * These assertions are written to hold in whatever timezone the test runner
 * happens to be in: dates are built with the local `Date` constructor and
 * compared against locally-derived keys, never against hardcoded UTC strings.
 */

import {
  addDays,
  daysBetween,
  isValidTime,
  nextOccurrence,
  occurrenceOn,
  parseDateKey,
  toDateKey,
  todayKey,
} from '../services/dateUtils';

describe('toDateKey', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toDateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('uses the local calendar day, not the UTC day', () => {
    // 23:30 local on the 5th. `toISOString()` would report the 6th for anyone
    // east of UTC and the 5th for anyone west; the local key must stay the 5th.
    const lateEvening = new Date(2026, 5, 5, 23, 30, 0);
    expect(toDateKey(lateEvening)).toBe('2026-06-05');

    const earlyMorning = new Date(2026, 5, 5, 0, 30, 0);
    expect(toDateKey(earlyMorning)).toBe('2026-06-05');
  });

  it('pads single-digit months and days', () => {
    expect(toDateKey(new Date(2026, 2, 7))).toBe('2026-03-07');
  });
});

describe('parseDateKey', () => {
  it('parses to local midnight', () => {
    const d = parseDateKey('2026-03-07');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(2);
    expect(d!.getDate()).toBe(7);
    expect(d!.getHours()).toBe(0);
  });

  it('rejects malformed input', () => {
    expect(parseDateKey('')).toBeNull();
    expect(parseDateKey('not-a-date')).toBeNull();
    expect(parseDateKey('2026-3-7')).toBeNull();
    expect(parseDateKey('2026-13-01')).toBeNull();
    expect(parseDateKey('2026-00-01')).toBeNull();
  });

  it('rejects days that would roll into the next month', () => {
    expect(parseDateKey('2026-02-31')).toBeNull();
    expect(parseDateKey('2026-04-31')).toBeNull();
  });

  it('accepts a real leap day and rejects a fake one', () => {
    expect(parseDateKey('2024-02-29')).not.toBeNull();
    expect(parseDateKey('2026-02-29')).toBeNull();
  });

  it('round-trips with toDateKey', () => {
    const key = '2026-09-08';
    expect(toDateKey(parseDateKey(key)!)).toBe(key);
  });
});

describe('daysBetween', () => {
  it('counts forward and backward', () => {
    expect(daysBetween('2026-01-01', '2026-01-02')).toBe(1);
    expect(daysBetween('2026-01-02', '2026-01-01')).toBe(-1);
    expect(daysBetween('2026-01-01', '2026-01-01')).toBe(0);
  });

  it('spans month and year boundaries', () => {
    expect(daysBetween('2026-01-31', '2026-02-01')).toBe(1);
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1);
    expect(daysBetween('2026-01-01', '2027-01-01')).toBe(365);
  });

  it('counts a DST transition as exactly one day', () => {
    // US spring forward 2026 (Mar 8) and fall back (Nov 1). These are 23- and
    // 25-hour local days; a naive millisecond division would give 0.958/1.042.
    expect(daysBetween('2026-03-07', '2026-03-08')).toBe(1);
    expect(daysBetween('2026-03-08', '2026-03-09')).toBe(1);
    expect(daysBetween('2026-10-31', '2026-11-01')).toBe(1);
    expect(daysBetween('2026-11-01', '2026-11-02')).toBe(1);
  });

  it('returns null for unparseable keys', () => {
    expect(daysBetween('nope', '2026-01-01')).toBeNull();
    expect(daysBetween('2026-01-01', 'nope')).toBeNull();
  });
});

describe('addDays', () => {
  it('adds and subtracts across boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('is a no-op for zero', () => {
    expect(addDays('2026-06-15', 0)).toBe('2026-06-15');
  });

  it('returns null for a bad key', () => {
    expect(addDays('bad', 1)).toBeNull();
  });
});

describe('nextOccurrence', () => {
  it('returns today when the time is still ahead', () => {
    const now = new Date(2026, 5, 10, 7, 0, 0);
    const next = nextOccurrence(9, 30, now);
    expect(toDateKey(next)).toBe('2026-06-10');
    expect(next.getHours()).toBe(9);
    expect(next.getMinutes()).toBe(30);
  });

  it('rolls to tomorrow when the time has passed', () => {
    const now = new Date(2026, 5, 10, 21, 0, 0);
    const next = nextOccurrence(9, 30, now);
    expect(toDateKey(next)).toBe('2026-06-11');
  });

  it('rolls to tomorrow when the time is exactly now', () => {
    // Scheduling for "right now" would fire immediately, which reads as a bug
    // to the user who just set the time.
    const now = new Date(2026, 5, 10, 9, 30, 0, 0);
    const next = nextOccurrence(9, 30, now);
    expect(toDateKey(next)).toBe('2026-06-11');
  });
});

describe('occurrenceOn', () => {
  it('places the time on the given day', () => {
    const d = occurrenceOn('2026-06-10', 8, 5);
    expect(d).not.toBeNull();
    expect(toDateKey(d!)).toBe('2026-06-10');
    expect(d!.getHours()).toBe(8);
    expect(d!.getMinutes()).toBe(5);
  });

  it('returns null for a bad key', () => {
    expect(occurrenceOn('bad', 8, 0)).toBeNull();
  });
});

describe('isValidTime', () => {
  it('accepts the full valid range', () => {
    expect(isValidTime(0, 0)).toBe(true);
    expect(isValidTime(23, 59)).toBe(true);
  });

  it('rejects out-of-range and non-integer values', () => {
    expect(isValidTime(24, 0)).toBe(false);
    expect(isValidTime(-1, 0)).toBe(false);
    expect(isValidTime(0, 60)).toBe(false);
    expect(isValidTime(0, -1)).toBe(false);
    expect(isValidTime(1.5, 0)).toBe(false);
    expect(isValidTime(NaN, 0)).toBe(false);
  });
});

describe('todayKey', () => {
  it('matches toDateKey for the same instant', () => {
    const now = new Date(2026, 8, 8, 14, 0, 0);
    expect(todayKey(now)).toBe(toDateKey(now));
  });
});
