import type { GramophoneSize } from "../stores/playerStore";

/**
 * Grammar of the floating gramophone window.
 * `disc` is the diameter of the record itself, `window` the square Tauri
 * window that hosts it. The window always keeps ~44px of slack under the disc
 * so the (static, contained) drop shadow can never be clipped by the edges.
 */
export const GRAMOPHONE_GEOMETRY: Record<
  GramophoneSize,
  { window: number; disc: number; label: string }
> = {
  compact: { window: 370, disc: 230, label: "Compact" },
  standard: { window: 436, disc: 296, label: "Standard" },
  large: { window: 496, disc: 356, label: "Large" },
};

export const GRAMOPHONE_SIZE_ORDER: GramophoneSize[] = ["compact", "standard", "large"];