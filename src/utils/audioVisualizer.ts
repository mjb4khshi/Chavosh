/**
 * Real-time Audio Spectrum Analysis Engine for Chavosh Visualizers
 * Connected to live HTML5 Audio with 64 FFT frequency bands.
 * Automatically handles Web Audio Context unlock on user gestures.
 */

let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let dataArray: Uint8Array | null = null;
const sourceNodes = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();

export interface AudioFrameData {
  bass: number; // 0..1 (low frequencies: kicks, sub-bass, 30-180Hz)
  mid: number; // 0..1 (vocals, guitars, instruments, 200-2200Hz)
  treble: number; // 0..1 (cymbals, hi-hats, harmonics, >3000Hz)
  bars: number[]; // 32 normalized real FFT frequency bands 0..1
  overall: number; // 0..1 (overall instantaneous energy)
  beatPulse: number; // 0..1 (isolated rhythmic kick drum transient: 0 at rest, 1 on punchy kick)
  time: number; // continuous timestamp in seconds
}

const emptyFrame: AudioFrameData = {
  bass: 0,
  mid: 0,
  treble: 0,
  bars: new Array(32).fill(0),
  overall: 0,
  beatPulse: 0,
  time: 0,
};

/**
 * Returns or initializes the global Web Audio Context
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Resumes AudioContext on user interaction to comply with browser autoplay policies
 */
export function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    return ctx.resume().catch(() => {});
  }
  return Promise.resolve();
}

// Global user gesture unlocker: ensures the very first click anywhere on the page unlocks audio
if (typeof window !== "undefined") {
  const unlock = () => {
    resumeAudioContext();
  };
  window.addEventListener("pointerdown", unlock, { passive: true, once: true });
  window.addEventListener("keydown", unlock, { passive: true, once: true });
}

/**
 * Attaches an HTMLAudioElement to the Web Audio Analyser node for live spectrum analysis
 */
export function attachAudioToAnalyser(audioElement: HTMLAudioElement) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    resumeAudioContext();

    if (!analyser) {
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256; // 128 frequency bins (crisp transient separation)
      analyser.smoothingTimeConstant = 0.35; // fast & responsive: zero latency on drum kicks
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.connect(ctx.destination);
    }

    if (!sourceNodes.has(audioElement)) {
      try {
        audioElement.crossOrigin = "anonymous";
      } catch {}
      const source = ctx.createMediaElementSource(audioElement);
      source.connect(analyser);
      sourceNodes.set(audioElement, source);
    }
  } catch (err) {
    console.debug("[Visualizer] Analyser attach info:", err);
  }
}

// Adaptive dynamic beat & kick transient tracking state
let rollingKickFloor = 0.18;
let beatPulse = 0;
let lastBeatTriggerTime = 0;

/**
 * Reads real-time instantaneous frequency data directly from the live song
 */
export function getInstantAudioFrame(isPlaying: boolean): AudioFrameData {
  const time = performance.now() / 1000;
  if (!isPlaying) {
    beatPulse = 0;
    rollingKickFloor = 0.18;
    return { ...emptyFrame, time, beatPulse: 0 };
  }

  if (analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);

    let sumBass = 0;
    let sumMid = 0;
    let sumTreble = 0;
    let totalSum = 0;

    const barsCount = 32;
    const bars: number[] = new Array(barsCount);

    for (let i = 0; i < barsCount; i++) {
      // Linear to dynamic perceived loudness curve
      const raw = dataArray[i] || 0;
      const normalized = raw / 255;
      bars[i] = normalized;
      totalSum += normalized;

      if (i < 5) {
        sumBass += normalized;
      } else if (i < 18) {
        sumMid += normalized;
      } else {
        sumTreble += normalized;
      }
    }

    if (totalSum > 0.005) {
      // 1. Frequency Band Energies
      const kickEnergy = Math.max(dataArray[0] || 0, dataArray[1] || 0) / 255;
      const subBass = ((dataArray[0] || 0) + (dataArray[1] || 0)) / 510;
      const bass = Math.min(1, Math.max(kickEnergy * 1.3, subBass * 1.4));
      const mid = Math.min(1, (sumMid / 13) * 1.4);
      const treble = Math.min(1, (sumTreble / 14) * 1.6);
      const overall = Math.min(1, (totalSum / barsCount) * 1.4);

      // 2. High-precision Transient Kick Drum Detection for Beat Pulse
      // Uses transient energy flux above dynamic baseline with strict onset threshold and refractory window
      const instantaneousKick =
        ((dataArray[0] || 0) * 0.7 + (dataArray[1] || 0) * 0.3) / 255;
      const flux = instantaneousKick - rollingKickFloor;
      const threshold = Math.max(0.06, rollingKickFloor * 0.28);

      // Trigger kick pulse only on distinct transient spikes with a 220ms refractory window
      // This prevents the scale from staying stuck in the expanded state on sustained bass!
      const now = time;
      if (
        flux > threshold &&
        instantaneousKick > 0.18 &&
        now - lastBeatTriggerTime > 0.22
      ) {
        const punchStrength = Math.min(
          1,
          Math.max(0.6, flux / Math.max(0.08, rollingKickFloor * 0.4))
        );
        beatPulse = punchStrength;
        lastBeatTriggerTime = now;
      }

      // Fast, snappy decay envelope (drops cleanly back to 0 within ~180ms so disc rests at 1.0 between beats)
      beatPulse *= 0.78;
      if (beatPulse < 0.01) beatPulse = 0;

      // Update adaptive rolling floor (slow tracking so it ignores transient spikes)
      rollingKickFloor = rollingKickFloor * 0.94 + instantaneousKick * 0.06;

      return {
        bass,
        mid,
        treble,
        bars,
        overall,
        beatPulse,
        time,
      };
    }
  }

  // When paused, silent, or unattached: keep beatPulse 0 (no out-of-sync fake pulses)
  beatPulse = 0;
  return {
    bass: 0,
    mid: 0,
    treble: 0,
    bars: new Array(32).fill(0),
    overall: 0,
    beatPulse: 0,
    time,
  };
}
