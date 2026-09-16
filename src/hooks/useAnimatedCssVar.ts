import { useEffect, useRef } from "react";

type RGB = [number, number, number];

/** Parses `#rgb`, `#rrggbb` and `rgb(...)` / `rgba(...)` into an RGB triple. */
function parseColor(input: string): RGB | null {
  const value = input.trim();
  if (!value) return null;

  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const raw =
      hex[1].length === 3
        ? hex[1]
            .split("")
            .map((c) => c + c)
            .join("")
        : hex[1];
    return [
      parseInt(raw.slice(0, 2), 16),
      parseInt(raw.slice(2, 4), 16),
      parseInt(raw.slice(4, 6), 16),
    ];
  }

  const rgb = value.match(/rgba?\(([^)]+)\)/i);
  if (rgb) {
    const parts = rgb[1]
      .split(/[\s,/]+/)
      .map((p) => Number.parseFloat(p))
      .filter((n) => !Number.isNaN(n));
    if (parts.length >= 3) return [parts[0], parts[1], parts[2]];
  }

  return null;
}

function toRgbString(rgb: RGB) {
  return `rgb(${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])})`;
}

/**
 * Writes a CSS custom property gradually instead of snapping.
 *
 * Used for `--primary`, which is derived from the album artwork: when the next
 * track loads the accent colour eases from the previous artwork colour to the
 * new one over `duration` ms (ease-out cubic), so the UI never flashes.
 * If a new target arrives mid-animation it continues from wherever the value
 * currently is on screen.
 */
export function useAnimatedCssVar(
  propName: string,
  target: string | null,
  duration = 800
) {
  const latestRef = useRef<RGB | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;

    if (!target) {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      latestRef.current = null;
      root.style.removeProperty(propName);
      return;
    }

    const to = parseColor(target);
    if (!to) {
      root.style.setProperty(propName, target);
      return;
    }

    // Continue from the value currently painted on screen (mid-animation safe),
    // otherwise fall back to the theme's own resolved token value.
    const from: RGB =
      latestRef.current ??
      parseColor(getComputedStyle(root).getPropertyValue(propName)) ??
      to;

    const startedAt = performance.now();
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const mixed: RGB = [
        from[0] + (to[0] - from[0]) * eased,
        from[1] + (to[1] - from[1]) * eased,
        from[2] + (to[2] - from[2]) * eased,
      ];
      latestRef.current = mixed;
      root.style.setProperty(propName, toRgbString(mixed));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(step);
  }, [propName, target, duration]);
}