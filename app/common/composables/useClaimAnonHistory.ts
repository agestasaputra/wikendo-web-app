/**
 * common/composables/useClaimAnonHistory.ts
 */
import { useAuthFetch } from "./useAuthFetch";

export function useClaimAnonHistory(): () => Promise<void> {
  const authFetch = useAuthFetch();
  return async () => {
    if (typeof window === "undefined") return;
    try {
      await authFetch("/api/history/claim", { method: "POST" });
    } catch {
      // best-effort: never block login / redirect
    }
  };
}
