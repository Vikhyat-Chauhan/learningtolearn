// Date helpers that operate on `YYYY-MM-DD` strings throughout, never `Date`
// objects across the wire — dates stored in Postgres are calendar days with no
// timezone, so string math avoids the off-by-one drift you get from parsing
// "2026-06-16" into a local/UTC Date.

export type ISODate = string; // "YYYY-MM-DD"

// Parse an ISO date as a UTC instant at midnight (so day arithmetic is stable
// regardless of the server/browser timezone).
function toUTC(iso: ISODate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fmt(date: Date): ISODate {
  return date.toISOString().slice(0, 10);
}

export function todayISO(): ISODate {
  // Local calendar day (what the user means by "today"), serialized to ISO.
  const now = new Date();
  return fmt(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = toUTC(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
}

// Day of week, Monday = 0 … Sunday = 6.
function mondayIndex(iso: ISODate): number {
  return (toUTC(iso).getUTCDay() + 6) % 7;
}

export function startOfWeek(iso: ISODate): ISODate {
  return addDays(iso, -mondayIndex(iso));
}

export function startOfMonth(iso: ISODate): ISODate {
  return `${iso.slice(0, 7)}-01`;
}

export function addMonths(iso: ISODate, n: number): ISODate {
  const d = toUTC(startOfMonth(iso));
  d.setUTCMonth(d.getUTCMonth() + n);
  return fmt(d);
}

export function weekDays(iso: ISODate): ISODate[] {
  const start = startOfWeek(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// A 6-row × 7-col grid covering the month of `iso`, Monday-first, padded with the
// trailing days of the previous month and leading days of the next so every cell
// is a real date.
export function monthMatrix(iso: ISODate): ISODate[][] {
  const first = startOfMonth(iso);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 7 }, (_, col) => addDays(gridStart, row * 7 + col)),
  );
}

export function isSameMonth(iso: ISODate, ref: ISODate): boolean {
  return iso.slice(0, 7) === ref.slice(0, 7);
}

export function isToday(iso: ISODate): boolean {
  return iso === todayISO();
}

export function dayNumber(iso: ISODate): number {
  return Number(iso.slice(8, 10));
}

const WEEKDAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const WEEKDAY_LABELS = WEEKDAY;

// "Mon 16 Jun"
export function formatDay(iso: ISODate): string {
  const d = toUTC(iso);
  return `${WEEKDAY[mondayIndex(iso)]} ${d.getUTCDate()} ${MONTH[d.getUTCMonth()].slice(0, 3)}`;
}

// "Jun 17" — compact, for review-schedule previews.
export function formatShort(iso: ISODate): string {
  const d = toUTC(iso);
  return `${MONTH[d.getUTCMonth()].slice(0, 3)} ${d.getUTCDate()}`;
}

// "June 2026"
export function formatMonthTitle(iso: ISODate): string {
  const d = toUTC(iso);
  return `${MONTH[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// "16–22 Jun" style range label for the weekly header.
export function formatWeekTitle(iso: ISODate): string {
  const days = weekDays(iso);
  return `${formatShort(days[0])} – ${formatShort(days[6])}`;
}
