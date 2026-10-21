/**
 * common/composables/useFirstLoad.ts — first-paint gate for pages whose data is already local.
 *
 * WHAT: `booting` = true on the FIRST mount of a page in this app session, false once the page's
 *   data task settles (and never again on later visits to the same page).
 * WHY: History reads localStorage SYNCHRONOUSLY and Account knows its state from Pinia, so
 *   neither has a real `pending` flag. Without a gate the page paints the EMPTY state for one
 *   frame → the user sees "Belum ada riwayat" (a lie) and then the cards. The skeleton must be
 *   the first thing painted, exactly like a server-backed page.
 * WHY a floor (minMs): a 0 ms localStorage read would flash the skeleton for a single frame,
 *   which reads as a glitch. 260 ms is long enough to register as intentional, short enough to
 *   stay under the 400 ms "instant" threshold.
 * EXAMPLE: const { booting } = useFirstLoad({ key: "history", task: load });
 *          <AppLoader v-if="booting" variant="history" />
 */
import { onMounted, ref, type Ref } from "vue";

/** Floor so an instant local read still reads as a deliberate loading state. */
const DEFAULT_MIN_MS = 260;

export interface FirstLoadOptions {
  /** Stable page id — the "already seen" flag is scoped to this key. */
  key: string;
  /** Work to finish before the real content is considered ready (fetch, store load, …). */
  task?: () => void | Promise<void>;
  /** Minimum skeleton time in ms (default 260). */
  minMs?: number;
}

/**
 * True while a page is booting its first paint. Flips false after `task` settles, but never
 * before `minMs`, so the skeleton is visible instead of flashing.
 */
export function useFirstLoad(options: FirstLoadOptions): {
  booting: Ref<boolean>;
} {
  const { key, task, minMs = DEFAULT_MIN_MS } = options;
  // useState, not module state: one flag per app instance (SSR-safe, reset on hard reload).
  const seen = useState<boolean>(`first-load:${key}`, () => false);
  const booting = ref(!seen.value);

  onMounted(async () => {
    if (seen.value) {
      booting.value = false;
      return;
    }
    const startedAt = Date.now();
    try {
      await task?.();
    } finally {
      const elapsed = Date.now() - startedAt;
      if (elapsed < minMs) {
        await new Promise((resolve) => setTimeout(resolve, minMs - elapsed));
      }
      // Mark as seen only AFTER the gate opens, so a fast refresh re-runs the task.
      seen.value = true;
      booting.value = false;
    }
  });

  return { booting };
}
