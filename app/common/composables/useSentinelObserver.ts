/**
 * common/composables/useSentinelObserver.ts — Sentinel infinity scroll (IntersectionObserver).
 *
 * APA: ref elemen sentinel; saat masuk viewport (rootMargin 320px) panggil onIntersect.
 * KENAPA: mall list + mall detail dulu menulis blok observer identik → 1 composable.
 *   Sentinel pindah tiap page baru → observe ulang via watch.
 * Contoh: const sentinel = useSentinelObserver(() => list.loadMore()) → <div ref="sentinel" />
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
