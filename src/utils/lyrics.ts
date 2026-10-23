export interface LyricLine {
  id: number;
  time: number; // in seconds
  text: string;
}

export interface LyricsData {
  synced: boolean;
  lines: LyricLine[];
  plain?: string;
  source: "embedded" | "lrc_file" | "lrclib" | "sample" | "manual";
  artist?: string;
  title?: string;
}

export function parseLrc(
  lrcText: string,
  defaultSource: LyricsData["source"] = "manual"
): LyricsData {
  if (!lrcText || !lrcText.trim()) {
    return { synced: false, lines: [], plain: "", source: defaultSource };
  }

  const rawLines = lrcText.split(/\r?\n/);
  const parsedLines: LyricLine[] = [];
  const timeRegex = /\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\]/g;
  let hasTimestamps = false;
  let lineId = 0;

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Check for ID tags: [ti:Title], [ar:Artist], etc.
    if (/^\[(ti|ar|al|by|offset|length):.*\]$/i.test(trimmed)) {
      continue;
    }

    const matches = [...trimmed.matchAll(timeRegex)];
    if (matches.length > 0) {
      hasTimestamps = true;
      const text = trimmed.replace(timeRegex, "").trim();
      for (const match of matches) {
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const millis = match[3]
          ? parseInt(match[3].padEnd(3, "0").slice(0, 3), 10)
          : 0;
        const totalSeconds = mins * 60 + secs + millis / 1000;
        parsedLines.push({
          id: lineId++,
          time: totalSeconds,
          text: text || "♪",
        });
      }
    } else if (!hasTimestamps) {
      parsedLines.push({
        id: lineId++,
        time: 0,
        text: trimmed,
      });
    }
  }

  if (hasTimestamps) {
    parsedLines.sort((a, b) => a.time - b.time);
    return {
      synced: true,
      lines: parsedLines,
      plain: parsedLines.map((l) => l.text).join("\n"),
      source: defaultSource,
    };
  }

  return {
    synced: false,
    lines: parsedLines,
    plain: lrcText,
    source: defaultSource,
  };
}

export function findActiveLyricIndex(
  lines: LyricLine[],
  currentTime: number
): number {
  if (!lines || lines.length === 0) return -1;
  let activeIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentTime + 0.15) {
      activeIndex = i;
    } else {
      break;
    }
  }
  return activeIndex;
}
