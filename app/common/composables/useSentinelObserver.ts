/**
 * common/composables/useSentinelObserver.ts — Infinity scroll sentinel (IntersectionObserver).
 *
 * WHAT: ref of the sentinel element; when it enters the viewport (rootMargin 320px) call onIntersect.
 * WHY: mall list + mall detail previously wrote an identical observer block → 1 composable.
 *   The sentinel changes on every new page → re-observe via watch.
 * EXAMPLE: const sentinel = useSentinelObserver(() => list.loadMore()) → <div ref="sentinel" />
 */
import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";

const ROOT_MARGIN = "320px";

export function useSentinelObserver(
  onIntersect: () => void,
): Ref<HTMLDivElement | null> {
  const sentinel = ref<HTMLDivElement | null>(null);
  let observer: IntersectionObserver | null = null;

  onMounted(() => {
    if (!("IntersectionObserver" in window)) return;
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onIntersect();
      },
      { rootMargin: ROOT_MARGIN },
    );
    if (sentinel.value) observer.observe(sentinel.value);
  });
  onUnmounted(() => observer?.disconnect());

  watch(sentinel, (el, _prev, onCleanup) => {
    if (el && observer) observer.observe(el);
    onCleanup(() => {
      if (el && observer) observer.unobserve(el);
    });
  });

  return sentinel;
}
