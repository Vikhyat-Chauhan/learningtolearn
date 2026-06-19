// Tag helpers shared by the client tag input and the server actions.

/** Max characters kept per tag, and max tags kept per topic. */
export const MAX_TAG_LENGTH = 40;
export const MAX_TAGS = 12;

// Normalize a raw tag list into the canonical form we store/display: trim each,
// drop empties, clamp length, and dedupe case-insensitively while preserving the
// first-seen casing. Order is preserved. Caps the count defensively.
export function normalizeTags(tags: readonly string[] | undefined | null): string[] {
  if (!tags) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim().slice(0, MAX_TAG_LENGTH);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}
