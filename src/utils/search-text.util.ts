export function buildSearchText(parts: (string | undefined | null)[]): string {
  return parts
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(' | ')
    .toLowerCase();
}
