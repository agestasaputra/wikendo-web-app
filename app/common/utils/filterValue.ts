/**
 * common/utils/filterValue.ts — Namespaced filter tokens (PURE).
 *
 * WHAT: filterValue(group, value) → "group:value"; readFilter(tokens, group) → satu nilai;
 *   readFilters(tokens, group) → semua nilai grup (chip multi); parseFilterValue(token).
 * WHY: FilterDrawer itu GENERIK — dia cuma emit string, tidak tahu domain mall/history.
 *   Halaman perlu decode token mana milik grup mana TANPA drawer mengimpor tipe domain
 *   (kalau drawer tahu tipe domain, komponen yang sama tidak bisa dipakai 3 halaman).
 * EXAMPLE: readFilter(["budget:mid","pref:halal"], "budget") → "mid".
 */
export interface FilterToken {
  group: string;
  value: string;
}

/** 1 chip → token ber-namespace. */
export function filterValue(group: string, value: string): string {
  return `${group}:${value}`;
}

/** Token → { group, value }. Token tanpa ":" = grup kosong (tidak pernah match grup mana pun). */
export function parseFilterValue(token: string): FilterToken {
  const idx = token.indexOf(":");
  if (idx === -1) return { group: "", value: token };
  return { group: token.slice(0, idx), value: token.slice(idx + 1) };
}

/** Semua nilai 1 grup, urut sesuai urutan chip dipilih. */
export function readFilters(tokens: string[], group: string): string[] {
  return tokens
    .map(parseFilterValue)
    .filter((t) => t.group === group)
    .map((t) => t.value);
}

/** Nilai pertama 1 grup (grup single-select). undefined = grup tidak aktif. */
export function readFilter(
  tokens: string[],
  group: string,
): string | undefined {
  return readFilters(tokens, group)[0];
}

/** Jumlah filter aktif = jumlah chip nyala (badge di tombol Filter). */
export function countFilters(tokens: string[]): number {
  return tokens.length;
}

/** Buang 1 nilai dari grup (chip "x" di ringkasan filter aktif). */
export function withoutFilter(
  tokens: string[],
  group: string,
  value: string,
): string[] {
  return tokens.filter((token) => {
    const parsed = parseFilterValue(token);
    return !(parsed.group === group && parsed.value === value);
  });
}
