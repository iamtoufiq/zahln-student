const parts = (version: string) => version.split(".").map((part) => Number.parseInt(part, 10) || 0);

export function isBelow(minimum: string, current: string): boolean {
  const min = parts(minimum);
  const cur = parts(current);
  for (let i = 0; i < Math.max(min.length, cur.length); i++) {
    const diff = (cur[i] ?? 0) - (min[i] ?? 0);
    if (diff !== 0) return diff < 0;
  }
  return false;
}
