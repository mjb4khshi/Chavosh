import React from "react";
import { type AudioFrameData } from "../utils/audioVisualizer";

interface LiquidWaveVisualizerProps {
  frame: AudioFrameData;
  isPlaying: boolean;
  responsive?: boolean;
}

/**
 * YouTube / Audiophile-grade Liquid Undulating Wave Ring Visualizer
 * Tightly hugs the 400px vinyl disc (radius = 200px) with elegant, calibrated displacement.
 * Features:
 *  - Primary dynamic turbulent liquid ribbon with multi-octave harmonic waves
 *  - Secondary resonant harmonic ribbon for 3D liquid depth
 *  - Subtle bass surge ripple ring radiating outward on beat drops
 */
export function LiquidWaveVisualizer({
  frame,
  isPlaying,
  responsive = false,
}: LiquidWaveVisualizerProps) {
  const { bass, mid, treble, bars, time, beatPulse = 0 } = frame;

  const size = 560;
  const cx = size / 2; // 280
  const cy = size / 2; // 280
  const baseRadius = 203; // Disc is 400px diameter (r = 200px)

  // 1. Primary Smooth Turbulent Wave Ring (72 points)
  const numPoints = 72;
  const primaryPoints: Array<{ x: number; y: number }> = [];
  const secondaryPoints: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;

    // Symmetrical frequency distribution: low frequencies along sides/bottom, highs at top
    const normalizedAngle = Math.abs(Math.sin(angle));
    const freqIndex = Math.min(
      bars.length - 1,
      Math.floor(normalizedAngle * bars.length)
    );

    // Real instantaneous audio frequency level from the song (0..1)
    const rawAmp = bars[freqIndex] || 0;
    // Lively, punchy amplitude calibrated between 8px and 38px max on heavy beats
    const audioAmp = isPlaying ? rawAmp * (8 + bass * 18 + beatPulse * 12) : 0;

    // Organic liquid wave modulation: lively harmonic ripples dancing along the rim
    const organicHarmonic =
      isPlaying && rawAmp > 0.01
        ? Math.sin(angle * 7 + time * 2.6) * (rawAmp * 5.2 + bass * 3.6)
        : 0;

    const r1 = baseRadius + audioAmp + organicHarmonic;
    primaryPoints.push({
      x: cx + r1 * Math.cos(angle),
      y: cy + r1 * Math.sin(angle),
    });

    // Secondary resonant ribbon for 3D liquid volume: lively and audio-driven
    const secHarmonic =
      isPlaying && rawAmp > 0.01
        ? Math.sin(angle * 6 - time * 2.2 + 1.4) * (rawAmp * 4.0 + mid * 2.8)
        : 0;
    const r2 = baseRadius + (isPlaying ? audioAmp * 0.75 + secHarmonic : 0);
    secondaryPoints.push({
      x: cx + r2 * Math.cos(angle),
      y: cy + r2 * Math.sin(angle),
    });
  }

  // Convert points array to a closed smooth cubic Bezier path (Catmull-Rom spline)
  const buildSmoothPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return "";
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} `;
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[(i - 1 + pts.length) % pts.length];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      const p3 = pts[(i + 2) % pts.length];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} `;
    }
    return d + "Z";
  };

  const primaryPathD = buildSmoothPath(primaryPoints);
  const secondaryPathD = buildSmoothPath(secondaryPoints);

  // Outer Kick Surge Ripple (tightly synced with drum kick beats)
  const pulseFactor = Math.max(beatPulse, bass * 0.75);
  const rippleRadius = baseRadius + 6 + (isPlaying ? pulseFactor * 22 : 0);
  const rippleOpacity = isPlaying ? Math.max(0.12, pulseFactor * 0.55) : 0.04;

  return (
    <svg
      className={`${responsive ? "w-full h-full" : "absolute"} pointer-events-none z-10 overflow-visible`}
      style={
        responsive
          ? undefined
          : {
              width: `${size}px`,
              height: `${size}px`,
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) rotate(${isPlaying ? (time * 6) % 360 : 0}deg)`,
            }
      }
      viewBox={`0 0 ${size} ${size}`}
    >
      <defs>
        {/* Exact Lyric-Matched Primary Gradient */}
        <linearGradient id="chavoshLiquidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary, #00d2ff)" />
          <stop offset="50%" stopColor="var(--primary, #00d2ff)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--primary, #00d2ff)" />
        </linearGradient>

        {/* Resonant Secondary Depth Ribbon Gradient */}
        <linearGradient id="chavoshSecondaryGrad" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--primary, #00d2ff)" stopOpacity="0.65" />
          <stop offset="50%" stopColor="var(--primary, #00d2ff)" stopOpacity="0.82" />
          <stop offset="100%" stopColor="var(--primary, #00d2ff)" stopOpacity="0.65" />
        </linearGradient>

        {/* Soft Radial Ambient Glow */}
        <radialGradient id="ringAmbientGlow" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="var(--primary, #00d2ff)" stopOpacity="0" />
          <stop offset="90%" stopColor="var(--primary, #00d2ff)" stopOpacity={0.25 + bass * 0.28} />
          <stop offset="100%" stopColor="var(--primary, #00d2ff)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient Radial Halo Ring behind waves */}
      <circle
        cx={cx}
        cy={cy}
        r={baseRadius + 10}
        fill="url(#ringAmbientGlow)"
        opacity={isPlaying ? 0.72 : 0.15}
      />

      {/* Outer Kick Surge Ripple */}
      {isPlaying && (
        <circle
          cx={cx}
          cy={cy}
          r={rippleRadius}
          fill="none"
          stroke="var(--primary, #00d2ff)"
          strokeWidth="1.6"
          strokeDasharray="6 6"
          opacity={rippleOpacity}
          style={{
            filter: "drop-shadow(0 0 8px var(--primary, #00d2ff))",
            transition: "all 0.08s ease-out",
          }}
        />
      )}

      {/* Secondary Resonant Fluid Wave (gives 3D depth to the liquid) */}
      <path
        d={secondaryPathD}
        fill="none"
        stroke="url(#chavoshSecondaryGrad)"
        strokeWidth={1.8 + mid * 1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.55 + (isPlaying ? mid * 0.35 : 0)}
        style={{
          filter: "drop-shadow(0 0 6px var(--primary, #00d2ff))",
        }}
      />

      {/* Main Turbulent Liquid Wave Ribbon */}
      <path
        d={primaryPathD}
        fill="none"
        stroke="url(#chavoshLiquidGrad)"
        strokeWidth={2.6 + bass * 2.0}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9 + (isPlaying ? bass * 0.1 : 0)}
        style={{
          filter:
            isPlaying && (beatPulse > 0.3 || bass > 0.25)
              ? "drop-shadow(0 0 10px var(--primary, #00d2ff)) drop-shadow(0 0 20px var(--primary, #00d2ff))"
              : "drop-shadow(0 0 6px var(--primary, #00d2ff))",
          transition: "stroke-width 0.08s ease-out",
        }}
      />
    </svg>
  );
}
