import { useEffect, useState } from "react";
import { getInstantAudioFrame, type AudioFrameData } from "../utils/audioVisualizer";

export function useVisualizerFrame(isPlaying: boolean, active: boolean = true): AudioFrameData {
  const [frame, setFrame] = useState<AudioFrameData>({
    bass: 0,
    mid: 0,
    treble: 0,
    bars: new Array(32).fill(0),
    overall: 0,
    beatPulse: 0,
    time: 0,
  });

  useEffect(() => {
    if (!active) return;
    let animId: number;

    const loop = () => {
      const data = getInstantAudioFrame(isPlaying);
      setFrame(data);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, active]);

  return frame;
}
