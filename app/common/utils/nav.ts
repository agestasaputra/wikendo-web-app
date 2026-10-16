/**
 * common/utils/nav.ts — Penentu tab BottomNav aktif.
 *
 * APA: isNavActive(tabPath, currentPath). PURE. Home aktif hanya di "/", tab lain juga di child route.
 * Contoh: isNavActive("/mall", "/mall/grand-indonesia") → true; isNavActive("/", "/mall") → false.
 */
export function isNavActive(tabPath: string, currentPath: string): boolean {
  if (tabPath === "/") return currentPath === "/";
  return currentPath === tabPath || currentPath.startsWith(tabPath + "/");
}
