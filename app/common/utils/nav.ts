/**
 * common/utils/nav.ts — Decides the active BottomNav tab.
 *
 * WHAT: isNavActive(tabPath, currentPath). PURE. Home is active only on "/", other tabs also on child routes.
 * EXAMPLE: isNavActive("/mall", "/mall/grand-indonesia") → true; isNavActive("/", "/mall") → false.
 */
export function isNavActive(tabPath: string, currentPath: string): boolean {
  if (tabPath === "/") return currentPath === "/";
  return currentPath === tabPath || currentPath.startsWith(tabPath + "/");
}
