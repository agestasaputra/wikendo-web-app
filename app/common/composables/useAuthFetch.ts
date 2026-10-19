/**
 * common/composables/useAuthFetch.ts — `$fetch` that carries the Supabase Bearer token (browser).
 *
 * WHAT: returns a `$fetch` clone whose `onRequest` hook reads the localStorage session and sets
 *   `Authorization: Bearer <access_token>` before the request leaves the browser.
 * WHY: the Supabase browser client stores its session in localStorage and NEVER writes an auth
 *   cookie. Every client call to a protected API (`/api/place/recommend`, `/api/food/recommend`,
 *   `/api/history`, `/api/quota`) therefore arrived anonymous → the server inserted quiz rows with
 *   `user_id = NULL` (orphan rows a logged-in history can never read) and the logged-in quota path
 *   was never taken. 106/106 production rows were orphaned on 19 Oct 2026.
 * WHY per-call (`$fetch: authFetch`) and not a global interceptor: Nuxt's `useFetch` imports
 *   `#build/fetch` directly and does NOT go through `globalThis.$fetch`, so patching the global
 *   would leave `useFetch` unauthenticated.
 * EXAMPLE: const authFetch = useAuthFetch();
 *   await useFetch("/api/place/recommend", { method: "POST", body, $fetch: authFetch });
 */
import { useSupabaseBrowser } from "./useSupabaseBrowser";

export function useAuthFetch(): typeof $fetch {
  return $fetch.create({
    onRequest: async (ctx) => {
      // SSR has no localStorage session → send the request anonymously (never throw).
      if (typeof window === "undefined") return;
      try {
        const { data } = await useSupabaseBrowser().auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const headers = new Headers(ctx.options.headers || {});
        headers.set("Authorization", `Bearer ${token}`);
        ctx.options.headers = headers;
      } catch {
        // Offline / storage blocked → keep the request anonymous, the API decides.
      }
    },
  });
}
