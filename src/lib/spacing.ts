// The spaced-repetition ladder: a topic logged on day D generates reviews due on
// D + each offset. The default is +1, +3, +7, +14, +30 days (a modified Ebbinghaus
// forgetting curve), but each user can customize their own ladder — stored on the
// profile and read server-side when materializing reviews. DEFAULT_LADDER is the
// fallback for users who never changed it.
export const DEFAULT_LADDER = [1, 3, 7, 14, 30] as const;

// Bounds for a user-defined ladder, enforced by validateLadder (and reused by the
// editor UI to drive its limits and messages).
export const MIN_RUNGS = 1;
export const MAX_RUNGS = 8;
export const MAX_DAY = 365;

// Validate and normalize a user-supplied ladder. Throws an Error with a
// user-facing message on the first rule it violates; otherwise returns the
// integer-coerced ladder. Rules: 1..MAX_RUNGS rungs, every value an integer in
// 1..MAX_DAY, strictly ascending (which also rules out duplicates).
export function validateLadder(values: number[]): number[] {
  if (!Array.isArray(values) || values.length < MIN_RUNGS) {
    throw new Error("Add at least one review interval.");
  }
  if (values.length > MAX_RUNGS) {
    throw new Error(`Use at most ${MAX_RUNGS} intervals.`);
  }
  const out: number[] = [];
  let prev = 0;
  for (const raw of values) {
    const n = Number(raw);
    if (!Number.isInteger(n)) {
      throw new Error("Each interval must be a whole number of days.");
    }
    if (n < 1 || n > MAX_DAY) {
      throw new Error(`Each interval must be between 1 and ${MAX_DAY} days.`);
    }
    if (n <= prev) {
      throw new Error("Intervals must increase from one to the next.");
    }
    out.push(n);
    prev = n;
  }
  return out;
}
